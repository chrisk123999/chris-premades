import {dialogUtils, workflowUtils} from '../../../../proxy.mjs';
async function prompt({document: activity}) {
    if (!await dialogUtils.confirmUseItem(activity.item)) return;
    await workflowUtils.completeActivityUse(activity);
}
export const instinctivePounce = {
    name: 'Instinctive Pounce',
    version: '2.0.4',
    rules: 'all',
    called: [
        {
            pass: 'actorRageBegin',
            macro: prompt,
            priority: 200
        }
    ]
};
