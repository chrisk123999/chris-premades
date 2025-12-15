import {combatUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function reaction({trigger: {entity: item, target}}) {
    if (!target.statuses.has('reaction')) return;
    if (!combatUtils.inCombat()) return;
    let change = target.changes.find(i => i.key === 'flags.midi-qol.actions.reactionsUsed');
    if (!change) return;
    let reactionsUsed = Number(change.value);
    if (reactionsUsed <= 1) return;
    let monksFocus = itemUtils.getItemByIdentifier(item.actor, 'ki') ?? itemUtils.getItemByIdentifier(item.actor, 'monksFocus');
    if (!monksFocus) return;
    await workflowUtils.syntheticItemRoll(item, [], {consumeResources: true, consumeUsage: true});
}
async function updated({trigger: {entity, item}}) {
    let identifier = genericUtils.getIdentifier(item);
    if (!['monksFocus', 'ki'].includes(identifier)) return;
    let effect = effectUtils.getEffectByIdentifier(entity.actor, 'mindOfMercuryEffect');
    if (!effect) return;
    if (item.system.uses.value) {
        if (effect.changes[0].value != '2') await genericUtils.update(effect, {changes: [{key: 'flags.midi-qol.actions.reactionsMax', mode: 5, priority: 20, value: '2'}]});
    } else {
        if (effect.changes[0].value != '1') await genericUtils.update(effect, {changes: [{key: 'flags.midi-qol.actions.reactionsMax', mode: 5, priority: 20, value: '1'}]});
    }
}
async function turn({trigger: {entity: item}}) {
    let reactionsUsed = item.actor.flags['midi-qol']?.actions?.reactionsUsed;
    if (!reactionsUsed) return;
    if (reactionsUsed == 1) return;
    let monksFocus = itemUtils.getItemByIdentifier(item.actor, 'ki') ?? itemUtils.getItemByIdentifier(item.actor, 'monksFocus');
    if (!monksFocus?.system?.uses?.value) return;
    let reactionUsed = effectUtils.getEffectByStatusID(item.actor, 'reaction');
    let effectData = genericUtils.duplicate(reactionUsed.toObject());
    let change = effectData.changes.find(i => i.key === 'flags.midi-qol.actions.reactionsUsed');
    if (change) change.value = '1';
    await genericUtils.update(reactionUsed, {changes: effectData.changes});
}
async function added({trigger: {entity: item}}) {
    let monkItem = itemUtils.getItemByIdentifier(item.actor, 'ki') ?? itemUtils.getItemByIdentifier(item.actor, 'monksFocus');
    if (!monkItem) return;
    let identifier = genericUtils.getIdentifier(monkItem);
    await itemUtils.correctActivityItemConsumption(item, ['use'], identifier);
}
export let mindOfMercury = {
    name: 'Mind of Mercury',
    version: '1.3.165',
    rules: 'legacy',
    effect: [
        {
            pass: 'actorCreated',
            macro: reaction,
            priority: 50
        }
    ],
    item: [
        {
            pass: 'actorUpdated',
            macro: updated,
            priority: 50
        },
        {
            pass: 'created',
            macro: added,
            priority: 55
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 55
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 55
        }
    ],
    combat: [
        {
            pass: 'everyTurn',
            macro: turn,
            priority: 50
        }
    ]
};