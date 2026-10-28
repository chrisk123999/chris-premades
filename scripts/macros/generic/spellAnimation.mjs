import {automationUtils, workflowUtils} from '../../proxy.mjs';
export function getDamageType(workflow) {
    const [rolled] = workflowUtils.getDamageTypes(workflow.damageRolls ?? []);
    return rolled ?? workflow.activity?.damage?.parts?.[0]?.types?.first();
}
export function getTargetResult(workflow, token) {
    return {
        hit: workflow.attackRoll ? workflow.hitTargets.has(token) : undefined,
        saved: workflow.activity?.save ? !workflow.failedSaves.has(token) : undefined,
        killed: !!workflow.damageList?.some(entry => (entry.actorUuid ?? entry.actor?.uuid) === token.actor?.uuid && entry.oldHP > 0 && entry.newHP <= 0)
    };
}
export function getTargetResults(workflow) {
    return Array.from(workflow.targets, token => ({token: token.document, ...getTargetResult(workflow, token)}));
}
export function playTargetAnimations(workflow, {animation, options}) {
    if (!workflow.token || !workflow.targets.size || !animation?.macros?.play) return;
    const damageType = getDamageType(workflow);
    for (const token of workflow.targets) {
        const self = token.document === workflow.token.document;
        if (self && workflow.activity?.type === 'utility') continue;
        animation.macros.play(self ? undefined : workflow.token.document, token.document, {...options, damageType, ...getTargetResult(workflow, token)});
    }
}
function late({document, workflow}) {
    playTargetAnimations(workflow, automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'spellAnimation'}));
}
/**
 * Plays an animation from the user to each target once the roll finishes.
 * Bound on an item. Fires on `itemRollFinished`.
 *
 * Config:
 * - `animation`: played from the user to each target. Receives the damage type, each target's hit or save result, and whether the roll dropped it to 0 HP.
 */
export const spellAnimation = {
    rules: 'all',
    version: '2.1.4',
    category: 'animations',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'itemRollFinished',
            macro: late,
            priority: 50
        }
    ],
    genericConfig: {
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'castBurst'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'targetToken', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            hint: ''
        }
    }
};
