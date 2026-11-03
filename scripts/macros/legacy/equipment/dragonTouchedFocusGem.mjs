import {dialogUtils, itemUtils, workflowUtils} from '../../../proxy.mjs';
async function teleport({document: item, workflow}) {
    if (workflow.item.type !== 'spell' || !itemUtils.getEquipmentState(item) || !workflow.token) return;
    if (!['spell', 'pact'].includes(workflow.item.system.method) || !workflowUtils.getCastLevel(workflow)) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'gem-teleport');
    if (!activity || !await dialogUtils.confirmUseItem(activity)) return;
    await workflowUtils.syntheticActivityRoll(activity, [workflow.token.document], {consumeUsage: false, consumeResources: false});
}
export const dragonTouchedFocusGem = {
    name: 'Dragon-Touched Focus (Stirring / Gem)',
    version: '2.1.7',
    rules: '2014',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: teleport,
            priority: 50
        }
    ]
};
