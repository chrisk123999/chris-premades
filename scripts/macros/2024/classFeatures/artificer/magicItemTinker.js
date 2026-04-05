import {activityUtils, constants, dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function chargePreCheck({trigger: {entity: item}, actor, token}) {    
    let items = fetchItems(actor, token).filter(i => Number.isNumeric(i.system.uses.max) && i.system.uses.spent > 0);
    if (!items?.length) {
        genericUtils.notify('CHRISPREMADES.Macros.MagicItemTinker.NoItems', 'warn');
        return true;
    }
    let selection = await specialLabelDialog(
        item.name, 
        'CHRISPREMADES.Macros.MagicItemTinker.ChargePrompt', 
        items, 
        i => `${i.system.uses.value}/${i.system.uses.max}`
    );
    if (!selection) return true;
    genericUtils.setProperty(actor.flags, 'chris-premades.magicItemTinkerID', selection);
}
async function charge({workflow}) {
    let chargeItem = await fromUuid(workflow.actor.flags['chris-premades']?.magicItemTinkerID);
    if (!chargeItem) return;
    let spellSlot = workflow.utilityRoll?.total;
    if (!spellSlot) return;
    await genericUtils.update(chargeItem, {'system.uses.spent': chargeItem.system.uses.spent - spellSlot});
}
async function drain({trigger: {entity: item}, actor, token}) {
    let items = fetchItems(actor, token);
    if (!items?.length) {
        genericUtils.notify('CHRISPREMADES.Macros.MagicItemTinker.NoItems', 'warn');
        return true;
    }
    let map = items.reduce((obj, i) => {
        let rarity = i.system.rarity;
        if (rarity === 'artifact') rarity = i.flags['chris-premades']?.originalRarity ?? rarity;
        return (obj[i.uuid] = {
            rarity,
            spellSlot: itemUtils.getConfig(item, `drain-${rarity}`) || -1 
        }, obj);
    }, {});
    let selection = await specialLabelDialog(
        item.name,
        'CHRISPREMADES.Macros.MagicItemTinker.DrainPrompt',
        items,
        i => {
            let { rarity, spellSlot } = map[i.uuid];
            let label = (CONFIG.DND5E.itemRarity[rarity] ?? rarity).capitalize();
            let spellLabel = CONFIG.DND5E.spellLevels[spellSlot] ?? genericUtils.translate('CHRISPREMADES.Macros.MagicItemTinker.NoSpell');
            return `${label}, ${spellLabel}`;
        }
    );
    if (!selection) return true;
    let slot = `spell${map[selection].spellSlot}`;
    if (!(slot in actor.system.spells)) return true;
    selection = items.find(i => i.uuid === selection);
    if (!selection) return true;
    if (itemUtils.getConfig(item, 'verifyDeletion') && !await dialogUtils.confirm(
        item.name,
        genericUtils.format(
            'CHRISPREMADES.Macros.MagicItemTinker.DeletePrompt', 
            {
                itemName: selection.name, 
                spellSlot: genericUtils.translate('DND5E.SpellSlotTemporary')
            }
        )
    )) return true;
    await genericUtils.update(actor, {
        [`system.spells.${slot}.value`]: actor.system.spells[slot].value + 1 
    });
    let createdEffect = await fromUuid(selection.flags.dnd5e?.dependentOn);
    await genericUtils.remove(createdEffect ?? selection);
}
async function transmute({trigger: {entity: item}, actor, token}) {    
    let feature = itemUtils.getItemByIdentifier(actor, 'replicateMagicItem');
    if (!feature) return true;
    let activity = activityUtils.getActivityByIdentifier(feature, 'createItem', {strict: true});
    if (!activity) return true;
    let plans = itemUtils.getAllItemsByIdentifier(actor, 'magicItemPlan');
    if (!plans.length) {
        genericUtils.notify('CHRISPREMADES.Macros.ReplicateMagicItem.NoPlans', 'warn');
        return true;
    }
    let items = fetchItems(actor, token);
    if (!items?.length) {
        genericUtils.notify('CHRISPREMADES.Macros.MagicItemTinker.NoItems', 'warn');
        return true;
    }
    let selection = await dialogUtils.selectDocumentDialog(item.name, 'CHRISPREMADES.Macros.MagicItemTinker.TransmutePrompt', items, {displayTooltips: true});
    if (!selection) return true;
    let createdEffect = await fromUuid(selection.flags.dnd5e?.dependentOn);
    await genericUtils.remove(createdEffect ?? selection);
    await workflowUtils.syntheticActivityRoll(activity);
}
function fetchItems(actor, token, range) {
    let items = actor.items.filter(i => i.flags['chris-premades']?.artificerMagicItem);
    let allies = tokenUtils.findNearby(token, range || 5, 'ally');
    for (let t of allies) {
        if (!t.actor) continue;
        items.push(...t.actor.items.filter(i => i.flags['chris-premades']?.artificerMagicItem));
    }
    return items;
}
async function specialLabelDialog(title, content, items, getLabel) {
    return await dialogUtils.buttonDialog(title, content, items.map(i => [
        i.name + ` (${getLabel(i)})`,
        i.uuid,
        {
            image: i.img,
            tooltip: i.system.description.value.replace(/<[^>]*>?|@UUID\[.*?\]{(.*?)}/gm, '$1')
        }
    ]));
}
export let magicItemTinker = {
    name: 'Magic Item Tinker',
    version: '1.5.17',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preTargeting',
                macro: chargePreCheck,
                priority: 50,
                activities: ['charge']
            },
            {
                pass: 'rollFinished',
                macro: charge,
                priority: 50,
                activities: ['charge']
            },
            {
                pass: 'preTargeting',
                macro: drain,
                priority: 50,
                activities: ['drain']
            },
            {
                pass: 'preTargeting',
                macro: transmute,
                priority: 50,
                activities: ['transmute']
            }
        ]
    },
    config: [
        {
            value: 'verifyDeletion',
            label: 'CHRISPREMADES.Config.ItemDelete',
            type: 'checkbox',
            default: true,
            category: 'mechanics'
        },
        {
            value: 'drain-common',
            label: 'CHRISPREMADES.Config.SpellSlot',
            i18nOption: 'CHRISPREMADES.Macros.MagicItemTinker.DrainCommon',
            type: 'select',
            default: '1',
            options: constants.spellSlotOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'drain-uncommon',
            label: 'CHRISPREMADES.Config.SpellSlot',
            i18nOption: 'CHRISPREMADES.Macros.MagicItemTinker.DrainUncommon',
            type: 'select',
            default: '2',
            options: constants.spellSlotOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'drain-rare',
            label: 'CHRISPREMADES.Config.SpellSlot',
            i18nOption: 'CHRISPREMADES.Macros.MagicItemTinker.DrainRare',
            type: 'select',
            default: '2',
            options: constants.spellSlotOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'drain-veryRare',
            label: 'CHRISPREMADES.Config.SpellSlot',
            i18nOption: 'CHRISPREMADES.Macros.MagicItemTinker.DrainVeryRare',
            type: 'select',
            default: '',
            options: constants.spellSlotOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
