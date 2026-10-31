import {actorUtils, automationUtils, dialogUtils, Logging, queryUtils, rollUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function promptAlly({document: activity, macroClass: {identifier, source}, workflow}) {
    if (workflowUtils.getWorkflowProperty(workflow, 'inspiringMovementAlly')) return;
    const token = workflow.token?.document;
    if (!token) return Logging.addMacroWarning(source, identifier, `Inspiring Movement exited early without an active token. (activity) ${activity.uuid}`);
    const rangeFormula = automationUtils.getConfigValue(activity.item, 'range');
    const range = (await rollUtils.rollDice(rangeFormula, {document: activity}))?.total;
    if (!range) return Logging.addMacroWarning(source, identifier, `Inspiring Movement exited early due to a failed formula parse. (activity) ${activity.uuid} (range) ${rangeFormula}`);
    const near = tokenUtils.findNearby(token, range, {disposition: 'ally', includeIncapacitated: false})
        .filter(t => t.actor && !actorUtils.hasUsedReaction(t.actor) && t.actor.system.attributes.movement.max > 0);
    if (!near.length) return Logging.addMacroWarning(source, identifier, 'CHRISPREMADES.Macros.Modern.HuntersMark.NoTargets', {notify: true});
    const choice = await dialogUtils.selectTargetDialog(activity.item.name, 'CHRISPREMADES.Macros.Modern.InspiringMovement', near, {skipDeadAndUnconscious: false});
    if (!choice?.result) return Logging.addMacroWarning(source, identifier, `Inspiring Movement exited early due to a declined target prompt. (activity) ${activity.uuid}`);
    const options = {};
    const item = activity.item.toObject();
    for (const id of Object.keys(item.system.activities))
        item.system.activities[id].consumption.targets = [];
    workflowUtils.setWorkflowProperty(options, 'inspiringMovementAlly', true);
    await workflowUtils.syntheticItemDataRoll(item, choice.result.actor, [], {options, userId: queryUtils.firstOwner(choice.result.actor, true)});
}
export const inspiringMovement = {
    name: 'Inspiring Movement',
    version: '2.1.7',
    rules: '2024',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: promptAlly,
            priority: 100 // after movementAnimation generic
        }
    ],
    config: {
        range: {
            default: '30',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range'
        }
    }
};
