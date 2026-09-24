import {automationUtils, crosshairUtils, dialogUtils, documentUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function early({document, workflow}) {
    if (documentUtils.getIdentifier(workflow.item) !== 'misty-step') return;
    if (!workflow.token) return;
    const range = automationUtils.getConfigValue(document, 'range');
    const allies = tokenUtils.findNearby(workflow.token.document, range, {disposition: 'ally', includeIncapacitated: false}).filter(token => tokenUtils.canSee(workflow.token.document, token));
    if (!allies.length) return;
    const selection = await dialogUtils.selectTargetDialog(document.name, _loc('CHRISPREMADES.Macros.Modern.MistyWanderer.TeleportAlly'), allies, {type: 'one'});
    if (selection?.result) workflowUtils.setWorkflowProperty(workflow, 'mistyWanderer.ally', selection.result);
}
async function late({document, workflow}) {
    const ally = workflowUtils.getWorkflowProperty(workflow, 'mistyWanderer.ally');
    if (!ally) return;
    const range = automationUtils.getConfigValue(document, 'range');
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    const destination = await crosshairUtils.aimCrosshair({token: workflow.token.document, maxRange: range});
    if (!destination || destination.cancelled) return;
    await tokenUtils.teleportToken(ally, {destination, animation, options, range});
}
export const mistyWanderer = {
    name: 'Misty Wanderer',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: early,
            priority: 40
        },
        {
            pass: 'actorRollFinished',
            macro: late,
            priority: 60
        }
    ],
    config: {
        range: {
            default: 5,
            type: 'number',
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.Range'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'mistyStep'
            },
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            category: 'animations',
            label: 'CHRISPREMADES.Config.Animation'
        }
    }
};
