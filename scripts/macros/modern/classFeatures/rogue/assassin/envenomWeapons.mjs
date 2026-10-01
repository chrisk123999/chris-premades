import {documentUtils, effectUtils, workflowUtils} from '../../../../../proxy.mjs';
async function turnEnd({document, token}) {
    const activity = effectUtils.getOriginActivitySync(document);
    if (!activity) return;
    const activityData = activity.toObject();
    activityData.effects = [];
    const workflow = await workflowUtils.syntheticActivityDataRoll(activityData, activity.item, [token], {consumeUsage: false, consumeResources: false});
    if (workflow?.failedSaves.size) return;
    await documentUtils.deleteDocument(document);
}
export const envenomWeapons = {
    name: 'Envenom Weapons',
    version: '2.0.0',
    rules: '2024',
    combat: [
        {
            pass: 'actorTurnEnd',
            macro: turnEnd,
            priority: 50
        }
    ]
};
