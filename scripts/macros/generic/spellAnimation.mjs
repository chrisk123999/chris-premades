import {automationUtils, workflowUtils} from '../../proxy.mjs';
function getDamageType(workflow) {
    const [rolled] = workflowUtils.getDamageTypes(workflow.damageRolls ?? []);
    return rolled ?? workflow.activity?.damage?.parts?.[0]?.types?.first();
}
export function playTargetAnimations(workflow, {animation, options}) {
    if (!workflow.token || !workflow.targets.size || !animation?.macros?.play) return;
    const damageType = getDamageType(workflow);
    const isAttack = !!workflow.attackRoll;
    const isSave = !!workflow.activity?.save;
    for (const token of workflow.targets) {
        animation.macros.play(workflow.token.document, token.document, {
            ...options,
            damageType,
            hit: isAttack ? workflow.hitTargets.has(token) : undefined,
            saved: isSave ? !workflow.failedSaves.has(token) : undefined
        });
    }
}
function late({document, workflow}) {
    playTargetAnimations(workflow, automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'spellAnimation'}));
}
export const spellAnimation = {
    rules: 'all',
    version: '2.0.0',
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
