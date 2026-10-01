import {actorUtils, applications, automationUtils, documentUtils, itemUtils, workflowUtils} from '../../../proxy.mjs';
async function formula({workflow}) {
    const data = {
        jumpType: documentUtils.getIdentifier(workflow.activity),
        formula: workflow.activity.roll.formula,
        token: workflow.token.document
    };
    await automationUtils.calledEvent('jump', workflow.actor, {multiResult: true, canOverlap: true, data});
    if (typeof data.formula !== 'string') return;
    if (data.formula === workflow.activity.roll.formula) return;
    const activityData = workflow.activity.toObject();
    activityData.roll.formula = data.formula;
    workflowUtils.setActivity(workflow, activityData);
}
async function doLongJump({workflow}) {
    workflow.rangeDetails.range = workflow.utilityRoll.total; // used in movementAnimation generic
    const selection = await applications.DialogApp.dialog(workflow.item.name, undefined, [
        ['checkbox', [
            {label: 'CHRISPREMADES.Macros.All.Jump.LowObstacle', name: 'lowObstacle'},
            {label: 'CHRISPREMADES.Macros.All.Jump.DifficultTerrain', name: 'difficultTerrain'}
        ], {displayAsRows: true}]
    ], 'okCancel');
    if (!selection?.buttons) return;
    if (selection.lowObstacle) {
        const activity = itemUtils.getActivityByIdentifier(workflow.item, 'lowObstacle');
        if (!activity) return;
        const lowObstacle = await workflowUtils.syntheticActivityRoll(activity, [workflow.token.document]);
        if (lowObstacle.failedSaves.size) return workflow.aborted = true;
    }
    if (selection.difficultTerrain) {
        const activity = itemUtils.getActivityByIdentifier(workflow.item, 'difficultTerrain');
        if (!activity) return;
        const options = {};
        workflowUtils.addMacroConditions(options, 'prone');
        const difficultTerrain = await workflowUtils.syntheticActivityRoll(activity, [workflow.token.document], {options});
        if (difficultTerrain.failedSaves.size) await actorUtils.applyConditions(workflow.actor, ['prone']);
    }
}
export const jump = {
    name: 'Jump',
    version: '2.0.4',
    rules: 'all',
    notes: 'Use the "actorJump" called event (async) to modify the jump distance formula.\n\tData available: formula, jumpType, token.',
    roll: [
        {
            pass: 'activityPreambleComplete',
            macro: formula,
            priority: 50
        }
    ]
};
export const longJump = {
    version: jump.version,
    rules: jump.rules,
    roll: [
        {
            pass: 'activityUtilityRollComplete',
            macro: doLongJump,
            priority: 50
        }
    ]
};
