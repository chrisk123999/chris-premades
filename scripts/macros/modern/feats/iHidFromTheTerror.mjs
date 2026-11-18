import {dialogUtils, documentUtils, itemUtils, queryUtils, workflowUtils} from '../../../proxy.mjs';
async function attack({document: item, workflow}) {
    const actor = item.actor;
    if (!workflow.activity?.hasAttack || !item.system.uses.value) return;
    const effects = actor.effects.filter(effect => effect.statuses.has('invisible') && effect.flags.dae?.specialDuration?.length);
    if (!effects.length) return;
    if (!await dialogUtils.confirmUseItem(item, {userId: queryUtils.firstOwner(actor, true)})) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'shadowed-strike');
    if (activity) await workflowUtils.completeActivityUse(activity, [], {fast: true});
    workflowUtils.setWorkflowProperty(workflow, 'shadowedStrike', effects.map(effect => [effect.uuid, effect.flags.dae.specialDuration]));
    await Promise.all(effects.map(effect => documentUtils.update(effect, {'flags.dae.specialDuration': []})));
}
async function finished({workflow}) {
    const stored = workflowUtils.getWorkflowProperty(workflow, 'shadowedStrike');
    if (!stored) return;
    for (const [uuid, specialDuration] of stored) {
        const effect = await fromUuid(uuid);
        if (effect) await documentUtils.update(effect, {'flags.dae.specialDuration': specialDuration});
    }
}
export const iHidFromTheTerror = {
    name: 'I Hid from the Terror',
    version: '2.1.9',
    rules: '2024',
    roll: [
        {
            pass: 'actorPreItemRoll',
            macro: attack,
            priority: 50
        },
        {
            pass: 'actorRollFinished',
            macro: finished,
            priority: 50
        }
    ]
};
