import {actorUtils, automationUtils, dialogUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function attacked({document: item, workflow, sourceToken}) {
    if (!sourceToken || !workflow.targets.size) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    const actor = sourceToken.actor;
    if (!actor || actorUtils.hasUsedReaction(actor)) return;
    if (!await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.Modern.ShadowyDodge.Use', {item: item.name}), {userId: queryUtils.firstOwner(actor, true)})) return;
    await actorUtils.setReactionUsed(actor);
    workflow.tracker.disadvantage.add('shadowy-dodge', item.name);
    workflowUtils.setWorkflowProperty(workflow, 'shadowyDodge.used', true);
}
async function late({document: item, workflow, sourceToken}) {
    if (!sourceToken || !workflowUtils.getWorkflowProperty(workflow, 'shadowyDodge.used')) return;
    const {animation, options} = automationUtils.getResolvedAnimation(item, 'animation');
    await tokenUtils.teleportToken(sourceToken, {animation, options, range: automationUtils.getConfigValue(item, 'range')});
}
export const shadowyDodge = {
    name: 'Shadowy Dodge',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {
            pass: 'targetAttackRollConfig',
            macro: attacked,
            priority: 50
        },
        {
            pass: 'targetRollFinished',
            macro: late,
            priority: 250
        }
    ],
    config: {
        range: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'homebrew'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'mistyStep'
            },
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
