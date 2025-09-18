import {activityUtils, constants, dialogUtils, workflowUtils} from '../../../../../utils.js';
async function slightOfHand({trigger, workflow}) {
    await workflow.actor.rollSkill({skill: 'slt'});
}
async function useAnObject({trigger, workflow}) {
    let items = workflow.actor.items.filter(item => constants.itemTypes.includes(item.type) && item.system.activities.find(activity => activity.activation.type === 'action' && !['attack', 'save', 'check', 'damage'].includes(activity.type) && !activityUtils.isHidden(activity)));
    if (!items.length) return;
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectAnItem', items, {sortAlphabetical: true});
    if (!selection) return;
    let activities = selection.system.activities.filter(activity => activity.activation.type === 'action' && !activityUtils.isHidden(activity));
    let activitySelection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectAnActivity', activities, {sortAlphabetical: true});
    if (!selection) return;
    await workflowUtils.specialItemUse(selection, Array.from(workflow.targets), workflow.item, {activity: activitySelection});
}
export let fastHands = {
    name: 'Fast Hands',
    version: '1.3.60',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: slightOfHand,
                priority: 50,
                activities: ['slightOfHand']
            },
            {
                pass: 'rollFinished',
                macro: useAnObject,
                priority: 50,
                activities: ['useAnObject']
            }
        ]
    }
};