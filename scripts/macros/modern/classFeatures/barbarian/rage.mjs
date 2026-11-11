import {keepRage as keepRageLegacy} from '../../../legacy/classFeatures/barbarian/rage.mjs';
import {actorUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
async function rageContinue({workflow}) {
    const combatData = tokenUtils.getCombatData(workflow.token);
    if (!combatData.inCombat) return;
    const rageEffect = actorUtils.getEffectByIdentifier(workflow.actor, 'rage');
    if (!rageEffect) return;
    await keepRageLegacy.utils.setTurn(combatData, rageEffect);
}
async function attackSave({document: rageEffect, workflow}) {
    const combatData = tokenUtils.getCombatData(workflow.token);
    if (!combatData.inCombat) return;
    if (!workflow.targets.count || (workflow.activity.actionType !== 'save' && !workflowUtils.isAttackType(workflow, 'attack'))) return;
    if (!workflow.targets.documents.some(t => t.disposition !== workflow.tokenDocument.disposition)) return;
    await keepRageLegacy.utils.setTurn(combatData, rageEffect);
}
export const extendRage = {
    name: 'Rage',
    rules: '2024',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: rageContinue,
            priority: 50
        }
    ]
};
export const keepRage = {
    name: extendRage.name,
    rules: extendRage.rules,
    roll: [
        {
            pass: 'actorRollFinished',
            macro: attackSave,
            priority: 300
        }
    ],
    combat: keepRageLegacy.combat
};
