import {choiceRemoveCondition} from '../../../generic.mjs';
import {queryUtils, workflowUtils} from '../../../../proxy.mjs';
async function rollFeature({document: activity}) {
    const conditions = choiceRemoveCondition.getConditions(activity);
    if (!conditions.length) return;
    const options = {};
    workflowUtils.setWorkflowProperty(options, 'choiceRemoveCondition', conditions);
    await workflowUtils.syntheticActivityRoll(activity, [], {options, userId: queryUtils.firstOwner(activity.actor, true)});
}
export const selfRestoration = {
    name: 'Self-Restoration',
    version: '2.0.4',
    rules: '2024',
    combat: [
        {
            pass: 'actorTurnEnd',
            macro: rollFeature
        }
    ]
};
