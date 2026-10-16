import {actorUtils, workflowUtils} from '../../../proxy.mjs';
async function rottingClaw({workflow}) {
    const target = workflow.hitTargets.first();
    if (!target?.actor?.statuses.has('poisoned')) return;
    const paralyze = actorUtils.getItemByIdentifier(workflow.actor, 'summon-undead-rotting-claw-paralyze');
    if (paralyze) await workflowUtils.syntheticItemRoll(paralyze, [target]);
}
export const summonUndeadRottingClaw = {
    name: 'Rotting Claw',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {pass: 'itemRollFinished', macro: rottingClaw, priority: 50}
    ]
};
