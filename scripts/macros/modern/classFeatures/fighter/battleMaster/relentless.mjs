import {actorUtils, dialogUtils, documentUtils, effectUtils, queryUtils, workflowUtils} from '../../../../../proxy.mjs';
function usesManeuver(activity, dice) {
    if (activity.item.system.type?.subtype !== 'maneuver' && activity.item !== dice) return false;
    return activity.consumption.targets.some(target => target.type === 'itemUses' && [dice.id, 'feat:superiority-dice'].includes(target.target));
}
async function preItemRoll({document: item, workflow}) {
    const dice = actorUtils.getItemByIdentifier(item.actor, 'superiority-dice');
    if (!item.system.uses.value || !dice?.system.uses.spent || !usesManeuver(workflow.activity, dice)) return;
    if (!await dialogUtils.confirmUseItem(item, {userId: queryUtils.firstOwner(item.actor, true)})) return;
    await documentUtils.update(dice, {'system.uses.spent': dice.system.uses.spent - 1});
    await documentUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
    const [effect] = await effectUtils.createEffects(item.actor, [documentUtils.getBaseEffectData(item, {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        changes: [{key: 'flags.chris-premades.superiorityDie', type: 'override', value: '1d8', phase: 'initial', priority: 50}]
    })]) ?? [];
    if (effect) workflowUtils.setWorkflowProperty(workflow, 'relentless', effect.uuid);
}
async function rollFinished({workflow}) {
    const uuid = workflowUtils.getWorkflowProperty(workflow, 'relentless');
    if (uuid) await documentUtils.deleteDocument(await fromUuid(uuid));
}
export const relentless = {
    name: 'Relentless',
    version: '2.1.9',
    rules: '2024',
    roll: [
        {
            pass: 'actorPreItemRoll',
            macro: preItemRoll,
            priority: 50
        },
        {
            pass: 'actorRollFinished',
            macro: rollFinished,
            priority: 50
        }
    ]
};
