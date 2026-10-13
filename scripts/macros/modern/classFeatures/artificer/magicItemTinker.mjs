import {actorUtils, applications, automationUtils, constants, dialogUtils, documentUtils, genericUtils, itemUtils, Logging, queryUtils, tokenUtils, uiUtils, workflowUtils} from '../../../../proxy.mjs';
import {swapArtificerPlan as artificer} from '../../../all.mjs';
// helpers
function notify(msg) {
    genericUtils.notify(msg, {type: 'warn'});
    return true;
}
function log(source, identifier, msg) {
    Logging.addMacroWarning(source, identifier, msg);
    return true;
}
async function fetchItems(token, range = 5) {
    const items = (await Promise.all(
        actorUtils.getEffectByIdentifier(token.actor, artificer.keys.createdEffectIdentifier, {multiple: true}).map(async e => {
            const document = await fromUuid(e.flags.dnd5e?.dependentOn);
            return document?.documentName === 'ActiveEffect' ? document.item: document;
        })
    )).filter(i => {
        if (!i) return false;
        if (i.actor.id === token.actor.id) return true;
        const holder = actorUtils.getFirstToken(i.actor);
        if (!holder) return false;
        return tokenUtils.getDistance(token, holder) <= range;
    });
    return items;
}
async function makeInputs(items, getLabel) {
    const inputs = [];
    for (const i of items) inputs.push({
        label: `[${i.parent.name}] ${i.name}` + (getLabel ? ` (${getLabel(i)})` : ''),
        name: i.uuid,
        options: {
            image: i.img,
            tooltip: await uiUtils.enrichHTML(i.system.description.value, i.getRollData())
        }
    });
    return inputs;
}
// macros
async function chargePreCheck({document: activity, config, dialog, macroClass: {source, identifier}, token}) {
    const slots = dialogUtils.getSpellSlotOptions(activity.actor);
    if (!slots.length) return notify('CHRISPREMADES.Macros.Legacy.PsionicSpells.NoSpells');
    const items = (await fetchItems(token)).filter(i => Number.isNumeric(i.system.uses.max) && i.system.uses.spent > 0);
    if (!items.length) return notify('CHRISPREMADES.Macros.Modern.MagicItemTinker.NoItems');
    const choices = await applications.DialogApp.dialog(
        activity.item.name,
        'CHRISPREMADES.Macros.Modern.MagicItemTinker.ChargePrompt',
        [
            ['combobox', [{
                options: {value: slots[0].value, options: slots},
                label: 'CHRISPREMADES.Config.SpellLevel',
                name: 'slot'
            }]],
            ['button', await makeInputs(items, i => `${i.system.uses.value}/${i.system.uses.max}`), {displayAsRows: true}]
        ],
        'cancel'
    );
    if (!choices?.buttons || !choices?.slot) return log(source, identifier, 'Magic Item Tinker: Charge exited early due to a declined prompt.');
    workflowUtils.setWorkflowProperty(config.workflow, 'magicItemTinkerCharge', items.find(i => i.uuid === choices.buttons));
    config.scaling = activity.actor.system.spells[choices.slot]?.level - 1 ?? 0;
    dialog.configure = false;
}
async function charge({workflow}) {
    const item = workflowUtils.getWorkflowProperty(workflow, 'magicItemTinkerCharge');
    if (!item) return;
    const slot = workflow.utilityRoll?.total;
    if (!slot) return;
    await documentUtils.update(item, {'system.uses.spent': item.system.uses.spent - slot});
}
async function drain({document: activity, dialog, macroClass: {source, identifier}, token}) {
    const settings = automationUtils.getConfigValues(activity.item, Object.keys(magicItemTinker.config));
    const items = (await fetchItems(token)).filter(i => settings[i.system.rarity]);
    if (!items.length) return notify('CHRISPREMADES.Macros.Modern.MagicItemTinker.NoItems');
    const choices = await applications.DialogApp.dialog(
        activity.item.name,
        'CHRISPREMADES.Macros.Modern.MagicItemTinker.DrainPrompt',
        [['button', await makeInputs(items, i => {
            const rarity = i.system.rarity;
            const label = CONFIG.DND5E.itemRarity[rarity] ?? rarity.capitalize();
            const slot = CONFIG.DND5E.spellLevels[settings[rarity]] ?? _loc('CHRISPREMADES.Macros.Modern.MagicItemTinker.NoSpell');
            return `${label}, ${slot}`;
        }), {displayAsRows: true}]],
        'cancel'
    );
    if (!choices?.buttons) return log(source, identifier, 'Magic Item Tinker: Drain exited early due to a declined prompt.');
    const item = items.find(i => i.uuid === choices.buttons);
    const slot = actorUtils.getSpellSlotKey(activity.actor, settings[item?.system.rarity]);
    if (!slot) return log(source, identifier, `Magic Item Tinker: Drain exited early due to an invalid choice: (item) ${item?.uuid} (rarity) ${item?.system.rarity} (slot gained) ${slot}`);
    if (settings.verify && !await dialogUtils.confirm(
        activity.item.name,
        _loc('CHRISPREMADES.Macros.Modern.MagicItemTinker.DeletePrompt', {item: item.name, spellslot: _loc('DND5E.SpellSlotTemporary')}),
        {userId: queryUtils.gmID()}
    )) return log(source, identifier, 'Magic Item Tinker: Drain was cancelled by the GM.');
    await documentUtils.update(activity.actor, {[`system.spells.${slot}.value`]: activity.actor.system.spells[slot].value + 1 });
    await documentUtils.deleteDocument(item);
    dialog.configure = false;
}
async function transmute({document: activity, macroClass: {source, identifier}, token}) {
    const feature = actorUtils.getItemByIdentifiers(activity.actor, ['replicate-magic-item', 'infuse-item'], {type: 'feat'});
    if (!feature) return log(source, identifier, 'Magic Item Tinker: Transmute exited early due to a missing feature. (identifier) replicate-magic-item OR infuse-item');
    const createActivity = itemUtils.getActivityByIdentifier(feature, artificer.keys.createActivity);
    if (!createActivity) return log(source, identifier, `Magic Item Tinker: Transmute exited early due to a missing activity. (item) ${feature.uuid} (identifier) ${artificer.keys.createActivity}`);
    const plans = artificer.getPlansAndInfusions(activity.actor, source);
    if (!plans.length) return notify('CHRISPREMADES.Macros.All.ArtificerPlans.NoPlans');
    const items = await fetchItems(token);
    if (!items.length) return notify('CHRISPREMADES.Macros.Modern.MagicItemTinker.NoItems');
    const choices = await applications.DialogApp.dialog(
        activity.item.name,
        'CHRISPREMADES.Macros.Modern.MagicItemTinker.TransmutePrompt',
        [['button', await makeInputs(items), {displayAsRows: true}]],
        'cancel'
    );
    const item = items.find(i => i.uuid === choices?.buttons);
    if (!item) return log(source, identifier, 'Magic Item Tinker: Drain exited early due to a declined prompt.');
    const holder = item.actor.uuid === token.actor.uuid ? token : actorUtils.getFirstToken(item.actor);
    await documentUtils.deleteDocument(item);
    await workflowUtils.syntheticActivityRoll(createActivity, [holder]);
}
const spellsPlusNone = () => [{label: _loc('COMMON.None'), value: ''}, ...constants.spellSlotOptions.filter(o => o.value > 0)];
export const magicItemTinker = {
    name: 'Magic Item Tinker',
    version: '2.1.2',
    rules: '2024',
    config: {
        verify: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.ItemDelete'
        },
        common: {
            default: 1,
            type: 'select',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Modern.MagicItemTinker.DrainCommon',
            get options() { return spellsPlusNone(); }
        },
        uncommon: {
            default: 2,
            type: 'select',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Modern.MagicItemTinker.DrainUncommon',
            get options() { return spellsPlusNone(); }
        },
        rare: {
            default: 2,
            type: 'select',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Modern.MagicItemTinker.DrainRare',
            get options() { return spellsPlusNone(); }
        },
        veryRare: {
            default: '',
            type: 'select',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Modern.MagicItemTinker.DrainVeryRare',
            get options() { return spellsPlusNone(); }
        }
    }
};
export const magicItemTinkerCharge = {
    version: magicItemTinker.version,
    rules: magicItemTinker.rules,
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: chargePreCheck,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: charge,
            priority: 50
        }
    ]
};
export const magicItemTinkerDrain = {
    version: magicItemTinker.version,
    rules: magicItemTinker.rules,
    roll: [
        {
            pass: 'activityPreItemRoll',
            macro: drain,
            priority: 50
        }
    ]
};
export const magicItemTinkerTransmute = {
    version: magicItemTinker.version,
    rules: magicItemTinker.rules,
    roll: [
        {
            pass: 'activityPreItemRoll',
            macro: transmute,
            priority: 50
        }
    ]
};
