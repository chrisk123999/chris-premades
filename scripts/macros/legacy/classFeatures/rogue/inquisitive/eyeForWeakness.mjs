import {automationUtils, documentUtils} from '../../../../../proxy.mjs';
async function formula({actor, document, data: {workflow}}) {
    const targetActor = workflow.hitTargets.first()?.actor;
    if (!targetActor) return;
    if (!documentUtils.getEffectByIdentifier(targetActor, 'insightfulFightingTarget', {sourceActor: actor})) return;
    return automationUtils.getConfigValue(document, 'formula');
}
export const eyeForWeakness = {
    name: 'Eye for Weakness',
    version: '2.0.0',
    rules: '2014',
    called: [
        {
            pass: 'actorSneakAttackFormula',
            macro: formula,
            priority: 50
        }
    ],
    config: {
        formula: {
            default: '3d6',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'behavior',
            hint: ''
        }
    }
};
