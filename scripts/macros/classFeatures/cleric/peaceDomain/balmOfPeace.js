import {activityUtils, genericUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    if (activityUtils.getIdentifier(workflow.activity) !== genericUtils.getIdentifier(workflow.item)) return;
    if (!workflow.targets.size) return;
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'balmOfPeaceHeal', {strict: true});
    if (!feature) return;
    for (let target of workflow.targets) {
        await workflowUtils.syntheticActivityRoll(feature, [target]);
    }
}
export let balmOfPeace = {
    name: 'Channel Divinity: Balm of Peace',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};