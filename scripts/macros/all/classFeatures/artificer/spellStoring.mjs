import {actorUtils, applications, automationUtils, compendiumUtils, constants, documentUtils, effectUtils, genericUtils, itemUtils, Logging, rollUtils, tokenUtils, uiUtils} from '../../../../proxy.mjs';
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
        const item = document?.documentName === 'ActiveEffect' ? document.item: document;
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
        const group = items.get(a.uuid) ?? [];
        group.push(...a.itemTypes.weapon.filter(w => !has(group, w.uuid) && ['simpleM', 'simpleR', 'martialM', 'martialR'].includes(w.system.type.value)));
        group.push(...a.itemTypes.tool.filter(t => !has(group, t.uuid) && tools.has(t.system.type.baseItem) && actor.system.tools[t.system.type.baseItem]?.value >= 1));
        items.set(a.uuid, group);
    }
    return items;
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
async function store({macroClass: {identifier, source}, workflow}) {
    const rules = documentUtils.getRules(workflow.item);
    const config = automationUtils.getConfigValues(workflow.item, Object.keys(spellStoringItem.config));
    const castActivity = itemUtils.getActivityByIdentifier(workflow.item, 'spell-storing-stored-spell')?.toObject();
    if (!castActivity) return Logging.addMacroWarning(source, identifier, 'Spell-Storing Item exited early due to a missing cast acttivity. (identifier) spell-storing-stored-spell');
    const uses = (await rollUtils.rollDice(config.uses, {document: workflow.activity}))?.total;
    if (uses === undefined) return Logging.addMacroWarning(source, identifier, `Spell-Storing Item exited early due to a failed formula parse. (formula) ${config.uses}`);
    const items = await fetchItems(workflow.actor, workflow.token?.document, new Set(config.tools), rules);
    const existingEffect = actorUtils.getEffectByIdentifier(workflow.actor, identifier);
    const existing = await fromUuid(existingEffect?.flags[source]?.createdSpellStoring);
    if (!existing && !items.size) return Logging.addMacroWarning(source, identifier, 'CHRISPREMADES.Macros.All.SpellStoringItem.NoItems', {notify: 'warn'});
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
        await ChatMessage.implementation.create({
            speaker: ChatMessage.implementation.getSpeaker({actor: workflow.actor}),
            content: _loc('CHRISPREMADES.Macros.All.SpellStoringItem.Recharge', {
                actor: workflow.actor.name,
                item: existing.item.name,
                target: existing.actor.name,
                uses: existing.uses.value,
                max: existing.uses.max
            })
        });
        await documentUtils.update(existing, {'uses.spent': 0});
        return;
    }
    const item = await fromUuid(choice?.buttons);
    if (!item) return Logging.addMacroWarning(source, identifier, 'Spell-Storing Item exited early due to a declined item choice prompt.');
    const spell = (await compendiumUtils.selectSpellFromLists(config.spellLists, {
        filters: rules === '2024' ? [{k: 'system.materials.consumed', v: false}] : undefined,
        maxLevel: config.maxLevel,
        title: workflow.item.name,
        icon: workflow.item.img,
        castTime: ['action']
    }))?.[0];
    if (!spell) return Logging.addMacroWarning(source, identifier, 'Spell-Storing Item exited early due to a declined spell choice prompt.');
    if (existingEffect) await documentUtils.deleteDocument(existingEffect);
    const parent = (await effectUtils.createEffects(workflow.actor, [{
        name: `[${item.actor.name}] ${workflow.item.name}`,
        img: workflow.item.img,
        origin: workflow.activity.uuid,
        flags: {cat: {identifier}}
    }]))?.[0];
    if (!parent) return Logging.addMacroWarning(source, identifier, `Spell-Storing Item failed to create parent effect. (self uuid) ${workflow.actor.uuid} (target item) ${item.uuid}`);
    castActivity.uses.max = uses;
    castActivity.spell.uuid = spell.uuid;
    castActivity.midiProperties.automationOnly = false;
    castActivity.spell.challenge = {
        attack: workflow.actor.system.attributes.spell.attack,
        save: workflow.actor.system.attributes.spell.dc,
        override: true
    };
    genericUtils.setProperty(castActivity, 'flags.dnd5e.dependentOn', parent.uuid);
    await documentUtils.update(item, {[`system.activities.${castActivity._id}`]: castActivity});
    const created = item.system.activities.get(castActivity._id);
    if (!created) return Logging.addMacroWarning(source, identifier, `Spell-Storing Item failed to create cast activity. (self uuid) ${workflow.actor.uuid} (target item) ${item.uuid}`);
    await documentUtils.setFlag(parent, source, 'createdSpellStoring', created.uuid);
}
export const spellStoringItem = {
    name: 'Spell-Storing Item',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: store,
            priority: 50
        }
    ],
    config: {
        uses: {
            default: 'max(2 * @abilities.int.mod, 2)',
            type: 'text',
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
