import {dialogUtils, documentUtils, effectUtils, itemUtils, queryUtils, workflowUtils} from '../../../proxy.mjs';
async function cast({workflow}) {
    if (workflow.activity.identifier !== 'call-lightning') return;
    const concentration = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    const bolt = itemUtils.getActivityByIdentifier(workflow.item, 'storm-bolt');
    if (!concentration || !bolt) return;
    const storming = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.All.CallLightning.Storming', {userId: queryUtils.firstOwner(workflow.actor, true)});
    if (storming) await documentUtils.setFlag(concentration, 'cat', 'castLevelBonus', 1);
    workflowUtils.syntheticActivityRoll(bolt, [], {atLevel: workflowUtils.getCastLevel(workflow) + (storming ? 1 : 0), consumeUsage: false, consumeResources: false, spellSlot: false});
}
export const callLightning = {
    name: 'Call Lightning',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {pass: 'itemRollFinished', macro: cast, priority: 50}
    ]
};
