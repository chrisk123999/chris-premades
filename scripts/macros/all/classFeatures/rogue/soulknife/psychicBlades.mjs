import {actorUtils, combatUtils, documentUtils, effectUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
const bonusAttacks = ['bonus-melee', 'bonus-ranged'];
const rangedAttacks = ['ranged', 'bonus-ranged'];
async function additionalIdentifiers({document}) {
    return documentUtils.getIdentifier(document);
}
async function range({document, actor, token, activity, workflow}) {
    if (!rangedAttacks.includes(activity.identifier) || workflow.targets.size !== 1 || !token) return;
    if (tokenUtils.getDistance(token, workflow.targets.first().document) <= 60) return;
    if (actorUtils.getItemByIdentifier(actor, 'sharpshooter')) return;
    workflow.tracker.disadvantage.add('psychic-blades', document.name);
}
async function late({document, actor, activity, token}) {
    if (activity.type !== 'attack') return;
    const effect = documentUtils.getEffectByIdentifier(actor, 'psychicBladesBonus');
    const isBonus = bonusAttacks.includes(activity.identifier);
    if (effect && (isBonus || !effect.active)) await documentUtils.deleteDocument(effect);
    if (isBonus || effect?.active || actorUtils.hasUsedBonusAction(actor) || (token && !combatUtils.isOwnTurn(token))) return;
    const sourceEffect = documentUtils.getEffectByIdentifier(document, 'psychicBladesBonus');
    if (!sourceEffect) return;
    await effectUtils.createEffects(actor, [documentUtils.getEffectData(document, sourceEffect.id, {activityUuid: activity.uuid})]);
}
async function vex({document, workflow}) {
    if (!workflow.hitTargets.size || !workflowUtils.isAttackType(workflow, 'attack')) return;
    const vexActivity = itemUtils.getActivityByIdentifier(document, 'vex');
    if (!vexActivity) return;
    await workflowUtils.syntheticActivityRoll(vexActivity, [workflow.hitTargets.first().document]);
}
export const psychicBlades = {
    name: 'Psychic Blades',
    version: '2.0.0',
    rules: 'all',
    roll: [
        {
            pass: 'itemAttackRollConfig',
            macro: range,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: late,
            priority: 50
        },
        {
            pass: 'itemCleanup',
            macro: vex,
            priority: 300
        }
    ],
    called: [
        {
            pass: 'actorSneakAttackAdditionalIdentifiers',
            macro: additionalIdentifiers,
            priority: 50
        }
    ]
};
