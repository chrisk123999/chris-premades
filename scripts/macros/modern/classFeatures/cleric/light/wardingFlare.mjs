import {actorUtils, workflowUtils} from '../../../../../proxy.mjs';
async function use({workflow}) {
    const improvedWardingFlare = actorUtils.getItemByIdentifier(workflow.actor, 'improved-warding-flare');
    if (!improvedWardingFlare) return;
    await workflowUtils.completeItemUse(improvedWardingFlare, Array.from(workflow.targets, t => t.document ?? t));
}
export const wardingFlare = {
    name: 'Warding Flare',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};
