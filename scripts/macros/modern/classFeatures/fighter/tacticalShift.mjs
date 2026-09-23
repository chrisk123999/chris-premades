import {instinctivePounce} from '../../../all/classFeatures/barbarian/instinctivePounce.mjs';
import {dialogUtils, documentUtils, workflowUtils} from '../../../../proxy.mjs';
async function use({document: activity, workflow}) {
    if (documentUtils.getIdentifier(workflow.item) !== 'second-wind') return;
    if (!await dialogUtils.confirmUseItem(activity.item)) return;
    await workflowUtils.syntheticActivityRoll(activity);
}
export const tacticalShift = {
    name: 'Tactical Shift',
    version: '2.0.4',
    rules: '2024',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: use,
            priority: 300
        },
        ...instinctivePounce.roll
    ],
    config: instinctivePounce.config
};
