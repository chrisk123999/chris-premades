import {actorUtils, applications, automationUtils, compendiumUtils, constants, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging, rollUtils, tokenUtils, uiUtils, workflowUtils} from '../../../../proxy.mjs';
import {swapArtificerPlan as artificer} from './useOrSwapPlan.mjs';
// helpers
async function fetchItems(actor, token, tools, rules) {
    // simple or martial weapons
    // 2014: all infusions + thieves or artisans tools with prof
    // 2024: created wand or weapon + thieves or artisans tools with prof
    const items = new Map();
    const has = (group, uuid) => group.some(i => i.uuid === uuid);
    await Promise.all(actorUtils.getEffectByIdentifier(actor, artificer.keys.createdEffectIdentifier, {multiple: true}).map(async e => {
        const document = await fromUuid(e.flags.dnd5e?.dependentOn);
        const item = document?.documentName === 'ActiveEffect' ? document.item : document;
        if (!item) return;
        if (rules === '2024' && !['trinket', 'wand'].includes(item.system.type.value)) return;
        const group = items.get(item.actor.uuid) ?? [];
        if (has(group, item.uuid)) return;
        group.push(item);
        items.set(item.actor.uuid, group);
    }));
    const actors = [actor];
    if (token) actors.push(...tokenUtils.findNearby(token, 999, {disposition: 'ally'}).map(t => t.actor));
    for (const a of actors) {
        if (!a) continue;
        const group = items.get(a.uuid) ?? [];
        group.push(...a.itemTypes.weapon.filter(w => !has(group, w.uuid) && ['simpleM', 'simpleR', 'martialM', 'martialR'].includes(w.system.type.value)));
        group.push(...a.itemTypes.tool.filter(t => !has(group, t.uuid) && tools.has(t.system.type.baseItem) && actor.system.tools[t.system.type.baseItem]?.value >= 1));
        if (group.length) items.set(a.uuid, group);
    }
    return items;
}
function hasRegisteredList(spellLists) {
    return spellLists.some(key => dnd5e.registry.spellLists.forType(key));
}
function getSheetSpells(actor, maxLevel, rules) {
    return actor.itemTypes.spell.filter(spell => spell.system.level >= 1
        && spell.system.level <= Number(maxLevel)
        && spell.system.activation?.type === 'action'
        && (spell.system.sourceItem?.startsWith('class:artificer') || spell.system.classIdentifier === 'artificer')
        && (rules !== '2024' || !spell.system.materials?.consumed));
}
async function selectSpell(item, config, rules) {
    if (hasRegisteredList(config.spellLists)) return (await compendiumUtils.selectSpellFromLists(config.spellLists, {
        filters: rules === '2024' ? [{k: 'system.materials.consumed', v: false}] : undefined,
        maxLevel: config.maxLevel,
        title: item.name,
        icon: item.img,
        castTime: ['action']
    }))?.[0];
    const spell = await dialogUtils.selectDocumentDialog(item.name, 'CHRISPREMADES.Macros.All.SpellStoringItem.SelectSheetSpell', getSheetSpells(item.actor, config.maxLevel, rules), {sort: 'alphabetical', showSpellLevel: true});
    if (!spell) return;
    return await fromUuid(spell._stats?.compendiumSource) ?? spell;
}
const makeButton = async item => ({
    label: item.name,
    name: item.uuid,
    options: {
        image: item.img,
        tooltip: await uiUtils.enrichHTML(item.system.description.value, item.getRollData())
    }
});
// macro
async function preTargeting({activity}) {
    const {spellLists, maxLevel} = automationUtils.getConfigValues(activity.item, ['spellLists', 'maxLevel']);
    if (hasRegisteredList(spellLists) || getSheetSpells(activity.actor, maxLevel, documentUtils.getRules(activity.item)).length) return;
    genericUtils.notify('CHRISPREMADES.Macros.All.SpellStoringItem.NoSpells', {type: 'warn'});
    return true;
}
async function stop(workflow, source, identifier, message, options) {
    await workflowUtils.refundUse(workflow);
    return Logging.addMacroWarning(source, identifier, message, options);
}
async function store({macroClass: {identifier, source}, workflow}) {
    const rules = documentUtils.getRules(workflow.item);
    const config = automationUtils.getConfigValues(workflow.item, Object.keys(spellStoringItem.config));
    const castActivity = itemUtils.getActivityByIdentifier(workflow.item, 'spell-storing-stored-spell')?.toObject();
    if (!castActivity) return stop(workflow, source, identifier, 'Spell-Storing Item exited early due to a missing cast activity. (identifier) spell-storing-stored-spell');
    const uses = (await rollUtils.rollDice(config.uses, {document: workflow.activity}))?.total;
    if (uses === undefined) return stop(workflow, source, identifier, `Spell-Storing Item exited early due to a failed formula parse. (formula) ${config.uses}`);
    const items = await fetchItems(workflow.actor, workflow.token?.document, new Set(config.tools), rules);
    const existingEffect = actorUtils.getEffectByIdentifier(workflow.actor, identifier);
    const existing = await fromUuid(existingEffect?.flags[source]?.createdSpellStoring);
    if (!existing && !items.size) return stop(workflow, source, identifier, 'CHRISPREMADES.Macros.All.SpellStoringItem.NoItems', {notify: 'warn'});
    const inputs = [];
    if (existing) inputs.push(['button', [{
        label: `[${existing.actor.name}] ${existing.item.name} - ${existing.uses.value}/${existing.uses.max}`,
        name: 'recharge',
        options: {
            image: existing.item.img,
            tooltip: await uiUtils.enrichHTML(existing.item.system.description.value, existing.getRollData())
        }
    }], {displayAsRows: true, legend: 'CHRISPREMADES.Macros.All.SpellStoringItem.Existing'}]);
    for (const group of items.values())
        inputs.push(['button', await Promise.all(group.map(i => makeButton(i))), {displayAsRows: true, legend: group[0].actor.name}]);
    const choice = await applications.DialogApp.dialog(workflow.item.name, 'CHRISPREMADES.Macros.All.SpellStoringItem.Prompt', inputs, 'cancel');
    if (choice?.buttons === 'recharge') {
        await MidiQOL.addCardNote(workflow, _loc('CHRISPREMADES.Macros.All.SpellStoringItem.Recharge', {
            actor: workflow.actor.name,
            item: existing.item.name,
            target: existing.actor.name,
            uses: existing.uses.value,
            max: existing.uses.max
        }));
        await documentUtils.update(existing, {'uses.spent': 0});
        return;
    }
    const item = await fromUuid(choice?.buttons);
    if (!item) return stop(workflow, source, identifier, 'Spell-Storing Item exited early due to a declined item choice prompt.');
    const spell = await selectSpell(workflow.item, config, rules);
    if (!spell) return stop(workflow, source, identifier, 'Spell-Storing Item exited early due to a declined spell choice prompt.');
    const parent = (await effectUtils.createEffects(workflow.actor, [{
        name: `[${item.actor.name}] ${workflow.item.name}`,
        img: workflow.item.img,
        origin: workflow.activity.uuid,
        flags: {cat: {identifier}}
    }]))?.[0];
    if (!parent) return stop(workflow, source, identifier, `Spell-Storing Item failed to create parent effect. (self uuid) ${workflow.actor.uuid} (target item) ${item.uuid}`);
    const created = await itemUtils.attachCastActivity(item, castActivity, spell, parent, {caster: workflow.actor, updates: {uses: {max: uses}}});
    if (!created) {
        await documentUtils.deleteDocument(parent);
        return stop(workflow, source, identifier, `Spell-Storing Item failed to create cast activity. (self uuid) ${workflow.actor.uuid} (target item) ${item.uuid}`);
    }
    if (existingEffect) await documentUtils.deleteDocument(existingEffect);
    await documentUtils.setFlag(parent, source, 'createdSpellStoring', created.uuid);
}
export const spellStoringItem = {
    name: 'Spell-Storing Item',
    version: '2.1.10',
    rules: 'all',
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: preTargeting,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: store,
            priority: 50
        }
    ],
    config: {
        uses: {
            default: 'max(2 * @abilities.int.mod, 2)',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Formula'
        },
        maxLevel: {
            default: '3',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.MaxLevel',
            get options() { return constants.spellSlotOptions; }
        },
        spellLists: {
            default: ['class:artificer'],
            type: 'select-many',
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.SpellList',
            get options() { return dnd5e.registry.spellLists.options; }
        },
        tools: {
            default: ['alchemist', 'brewer', 'calligrapher','carpenter', 'cartographer', 'cobbler', 'cook', 'glassblower', 'jeweler', 'leatherworker', 'mason', 'painter', 'potter', 'smith', 'thief', 'tinker', 'weaver', 'woodcarver'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Tools',
            get options() { return constants.toolOptions; }
        }
    }
};
