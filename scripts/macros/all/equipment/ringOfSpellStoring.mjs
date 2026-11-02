import {dialogUtils, documentUtils, genericUtils, queryUtils, tokenUtils} from '../../../proxy.mjs';
function spellsOf(actor, capacity) {
    return actor.items.filter(item => item.type === 'spell' && item.system.level > 0 && item.system.level <= capacity);
}
async function chooseCaster(ring, token, capacity) {
    const casters = [ring.actor, ...(token ? tokenUtils.findNearby(token, 5, {disposition: 'all'}).map(nearby => nearby.actor) : [])].filter(actor => actor && spellsOf(actor, capacity).length);
    if (casters.length < 2) return casters[0];
    return await dialogUtils.selectDocumentDialog(ring.name, 'CHRISPREMADES.Macros.All.RingOfSpellStoring.Caster', Array.from(new Set(casters)));
}
async function store({document: ring, workflow}) {
    if (workflow.activity.identifier !== 'store-spell') return;
    const capacity = ring.system.uses.value;
    if (!capacity) return genericUtils.notify('CHRISPREMADES.Macros.All.RingOfSpellStoring.Full', {type: 'info'});
    const caster = await chooseCaster(ring, workflow.token?.document, capacity);
    if (!caster) return genericUtils.notify('CHRISPREMADES.Macros.All.RingOfSpellStoring.NoSpells', {type: 'info'});
    const userId = queryUtils.firstOwner(caster, true);
    const spell = await dialogUtils.selectDocumentDialog(ring.name, 'CHRISPREMADES.Macros.All.RingOfSpellStoring.SelectSpell', spellsOf(caster, capacity), {userId, showSpellLevel: true, sort: 'level'});
    if (!spell) return;
    const [slot] = await dialogUtils.selectSpellSlots(caster, ring.name, 'CHRISPREMADES.Macros.All.RingOfSpellStoring.SelectSlot', {maxAmount: 1, maxAmountMode: 'count', minLevel: spell.system.level, maxLevel: capacity, userId}) || [];
    if (!slot) return;
    const level = slot.key === 'pact' ? caster.system.spells.pact.level : Number(slot.key.replace('spell', ''));
    await documentUtils.update(caster, {['system.spells.' + slot.key + '.value']: caster.system.spells[slot.key].value - 1});
    const id = foundry.utils.randomID();
    const activity = {
        _id: id,
        type: 'cast',
        name: spell.name,
        img: spell.img,
        identifier: 'stored-spell-' + id.toLowerCase(),
        activation: {type: spell.system.activation?.type ?? 'action', value: spell.system.activation?.value ?? 1, override: true},
        consumption: {targets: [{type: 'activityUses', value: '1', target: ''}], scaling: {allowed: false, max: ''}, spellSlot: false},
        uses: {spent: 0, max: '1', recovery: []},
        spell: {uuid: spell.uuid, level, spellbook: false, properties: ['vocal', 'somatic', 'material'], challenge: {attack: caster.system.attributes.spell.attack, save: caster.system.attributes.spell.dc, override: true}},
        flags: {cat: {storedLevel: level}}
    };
    await documentUtils.update(ring, {[`system.activities.${id}`]: activity, 'system.uses.spent': ring.system.uses.spent + level});
}
async function release({document: ring, workflow}) {
    const [, itemId, , activityId] = (workflow.item.flags.dnd5e?.cachedFor ?? '').split('.').slice(-4);
    if (itemId !== ring.id) return;
    const live = ring.actor.items.get(ring.id);
    const level = live?.system.activities.get(activityId)?.flags?.cat?.storedLevel;
    if (!level) return;
    await documentUtils.update(live, {[`system.activities.-=${activityId}`]: null, 'system.uses.spent': Math.max(live.system.uses.spent - level, 0)});
}
export const ringOfSpellStoring = {
    name: 'Ring of Spell Storing',
    version: '2.1.7',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: store,
            priority: 50
        },
        {
            pass: 'actorRollFinished',
            macro: release,
            priority: 60
        }
    ]
};
