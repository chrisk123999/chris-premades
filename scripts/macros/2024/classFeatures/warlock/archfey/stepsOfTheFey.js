import {activityUtils, dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function heal({trigger, workflow}) {
    if (!workflow.token) return;
    let mistyStep = itemUtils.getItemByIdentifier(workflow.actor, 'mistyStep');
    if (!mistyStep) return;
    await workflowUtils.syntheticItemRoll(mistyStep, [workflow.token]);
    let heal = activityUtils.getActivityByIdentifier(workflow.item, 'heal', {strict: true});
    if (!heal) return;
    let nearby = tokenUtils.findNearby(workflow.token, itemUtils.getConfig(workflow.item, 'distance'), 'ally', {includeIncapacitated: true, includeToken: true});
    console.log(nearby);
    if (!nearby.length) return;
    let selection;
    if (nearby.length === 1) {
        selection = nearby[0];
    } else {
        let selected = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectATarget', nearby, {skipDeadAndUnconscious: false});
        if (!selected) return;
        selection = selected[0];
    }
    await workflowUtils.syntheticActivityRoll(heal, [selection]);
}
async function taunt({trigger, workflow}) {
    if (!workflow.token) return;
    let mistyStep = itemUtils.getItemByIdentifier(workflow.actor, 'mistyStep');
    if (!mistyStep) return;
    await workflowUtils.syntheticItemRoll(mistyStep, [workflow.token]);
}
export let stepsOfTheFey = {
    name: 'Steps of the Fey',
    version: '1.3.156',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: heal,
                priority: 50,
                activities: ['refreshingStep']
            },
            {
                pass: 'rollFinished',
                macro: taunt,
                priority: 50,
                activities: ['tauntingStep']
            }
        ]
    },
    config: [
        {
            value: 'distance',
            label: 'CHRISPREMADES.Config.Distance',
            default: 10,
            category: 'homewbrew',
            homebrew: true
        }
    ]
};