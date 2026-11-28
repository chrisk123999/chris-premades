import {actorUtils, compendiumUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging} from '../../../proxy.mjs';
async function imbue({document: item, workflow}) {
    if (workflow.activity.identifier !== 'imbue-card') return;
    const template = itemUtils.getActivityByIdentifier(item, 'imbued-card')?.toObject();
    if (!template) return Logging.addMacroWarning('chris-premades', 'cartomancer-hidden-ace-imbue-card', 'Missing the imbued-card activity.', {notify: 'warn'});
    const maxLevel = Math.max(0, ...Object.values(workflow.actor.system.spells).filter(slot => slot.max).map(slot => slot.level));
    const lists = Object.values(workflow.actor.spellcastingClasses).flatMap(cls => ['class:' + cls.identifier, cls.subclass && 'subclass:' + cls.subclass.identifier]).filter(key => key && dnd5e.registry.spellLists.options.some(option => option.value === key));
    if (!maxLevel || !lists.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Legacy.ImbueCard.NoSpells', {type: 'info'});
        return;
    }
    const [spell] = await compendiumUtils.selectSpellFromLists(lists, {maxLevel, castTime: ['action'], title: item.name, icon: item.img}) ?? [];
    if (!spell) return;
    const previous = actorUtils.getEffectByIdentifier(workflow.actor, 'imbueCard');
    if (previous) await documentUtils.deleteDocument(previous);
    const [parent] = await effectUtils.createEffects(workflow.actor, [{name: item.name + ': ' + spell.name, img: item.img, origin: item.uuid, duration: {value: 28800, units: 'seconds'}, flags: {cat: {identifier: 'imbueCard'}}}]) ?? [];
    if (!parent) return;
    await itemUtils.attachCastActivity(item, template, spell, parent, {updates: {name: spell.name, img: spell.img}});
}
async function flourish({document: item, workflow}) {
    const [, itemId, , activityId] = (workflow.item.flags.dnd5e?.cachedFor ?? '').split('.').slice(-4);
    if (itemId !== item.id) return;
    const parentUuid = item.system.activities.get(activityId)?.flags.dnd5e?.dependentOn;
    const parent = parentUuid && await fromUuid(parentUuid);
    if (parent) await documentUtils.deleteDocument(parent);
}
export const imbueCard = {
    name: 'Cartomancer: Hidden Ace - Imbue Card',
    version: '2.1.9',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: imbue,
            priority: 50
        },
        {
            pass: 'actorRollFinished',
            macro: flourish,
            priority: 60
        }
    ]
};
