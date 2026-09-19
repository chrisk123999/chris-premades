import {automationUtils, dialogUtils, documentUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function late({document, workflow}) {
    if (documentUtils.getIdentifier(workflow.activity) !== automationUtils.getConfigValue(document, 'activityIdentifier')) return;
    if (!workflow.hitTargets.size) return;
    const validTargets = Array.from(workflow.hitTargets, token => token.document).filter(token => tokenUtils.getDistance(workflow.token.document, token) > 5);
    if (!validTargets.length) return;
    const selection = await dialogUtils.confirmUseItem(document);
    if (!selection) return;
    let target = validTargets[0];
    if (validTargets.length > 1) {
        const choice = await dialogUtils.selectTargetDialog(document.name, _loc('CHRISPREMADES.Macros.Legacy.GraspOfHadar.Select', {item: document.name}), validTargets, {type: 'one'});
        target = choice?.result;
    }
    if (!target) return;
    const distance = tokenUtils.getDistance(workflow.token.document, target);
    await workflowUtils.completeItemUse(document, [target]);
    await tokenUtils.slideToken(target, {sourceToken: workflow.token.document, distance: distance <= 10 ? -5 : -10});
}
export const graspOfHadar = {
    name: 'Eldritch Invocations: Grasp of Hadar',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: late,
            priority: 50
        }
    ],
    config: {
        activityIdentifier: {
            default: 'eldritch-blast-beam',
            type: 'text',
            label: 'CHRISPREMADES.Config.Activity',
            category: 'homebrew'
        }
    }
};
