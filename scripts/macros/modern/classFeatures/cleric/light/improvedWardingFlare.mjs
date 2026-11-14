import {documentUtils, workflowUtils} from '../../../../../proxy.mjs';
async function tempHP({document: activity, workflow}) {
    if (documentUtils.getIdentifier(workflow.item) !== 'warding-flare') return;
    await workflowUtils.syntheticActivityRoll(activity, workflow.targets.documents);
}
export const improvedWardingFlare = {
    name: 'Improved Warding Flare',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: tempHP,
            priority: 200
        }
    ]
};
