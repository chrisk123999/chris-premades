import {activityUtils, documentUtils, workflowUtils} from '../../../../../proxy.mjs';
async function refresh(item) {
    const effect = item.effects.find(entry => entry.transfer);
    const activity = item.system.activities.contents[0];
    if (!effect || !activity) return;
    const usable = activityUtils.checkCosts(activity);
    if (effect.disabled === usable) await documentUtils.update(effect, {disabled: !usable});
}
async function reacted({document: item, effect}) {
    if (!effect.statuses.has('reaction') || !item.actor.inCombat) return;
    const used = Number(effect.system.changes.find(change => change.key === 'flags.midi-qol.actions.reactionsUsed')?.value ?? 0);
    if (used <= 1) return;
    const activity = item.system.activities.contents[0];
    if (activity) await workflowUtils.completeActivityUse(activity, []);
    await refresh(item);
}
async function changed({document: item}) {
    await refresh(item);
}
export const mindOfMercury = {
    name: 'Mind of Mercury',
    version: '2.1.11',
    rules: '2014',
    effect: [
        {
            pass: 'actorCreated',
            macro: reacted,
            priority: 50
        }
    ],
    combat: [
        {
            pass: 'actorEveryTurn',
            macro: changed,
            priority: 50
        }
    ],
    item: [
        {
            pass: 'actorUpdated',
            macro: changed,
            priority: 50
        },
        {
            pass: 'updated',
            macro: changed,
            priority: 50
        }
    ]
};
