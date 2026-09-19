import {actorUtils, automationUtils, dialogUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function step({document, workflow}) {
    const identifier = workflow.activity.identifier;
    if (!['refreshing-step', 'taunting-step'].includes(identifier)) return;
    const mistyStep = actorUtils.getItemByIdentifier(workflow.actor, automationUtils.getConfigValue(document, 'spellIdentifier'));
    if (!mistyStep) return;
    await workflowUtils.completeItemUse(mistyStep, [workflow.token.document], {spellSlot: false});
    if (identifier !== 'refreshing-step') return;
    const heal = itemUtils.getActivityByIdentifier(document, 'heal');
    if (!heal) return;
    const nearby = tokenUtils.findNearby(workflow.token.document, automationUtils.getConfigValue(document, 'distance'), {disposition: 'ally', includeToken: true});
    if (!nearby.length) return;
    let selection = nearby[0];
    if (nearby.length > 1) {
        const selected = await dialogUtils.selectTargetDialog(document.name, _loc('CHRISPREMADES.Macros.Modern.StepsOfTheFey.Select'), nearby, {skipDeadAndUnconscious: false});
        selection = selected?.result;
    }
    if (!selection) return;
    await workflowUtils.completeActivityUse(heal, [selection]);
}
export const stepsOfTheFey = {
    name: 'Steps of the Fey',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {pass: 'itemRollFinished', macro: step, priority: 50}
    ],
    config: {
        distance: {
            default: 10,
            type: 'number',
            label: 'CHRISPREMADES.Config.Distance',
            category: 'homebrew'
        },
        spellIdentifier: {
            default: 'misty-step',
            type: 'text',
            label: 'CHRISPREMADES.Config.Identifiers',
            category: 'homebrew'
        }
    }
};
