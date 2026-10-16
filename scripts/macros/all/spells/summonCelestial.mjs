import {dialogUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function mace({document, workflow}) {
    if (workflow.activity.identifier === 'temp-hp' || !workflow.hitTargets.size || !workflow.token) return;
    const activity = itemUtils.getActivityByIdentifier(document, 'temp-hp');
    if (!activity) return;
    const nearby = [workflow.token.document, ...tokenUtils.findNearby(workflow.token.document, 10, {disposition: 'ally'})];
    const selection = nearby.length > 1 ? await dialogUtils.selectTargetDialog(document.name, 'CHRISPREMADES.Macros.All.SummonCelestial.Temp', nearby, {skipDeadAndUnconscious: false, userId: queryUtils.firstOwner(workflow.actor, true)}) : {result: nearby[0]};
    if (!selection?.result) return;
    await workflowUtils.syntheticActivityRoll(activity, [selection.result]);
}
export const summonCelestialMace = {
    name: 'Radiant Mace',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {pass: 'itemRollFinished', macro: mace, priority: 50}
    ]
};
