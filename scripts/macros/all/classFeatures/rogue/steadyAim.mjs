import {actorUtils, combatUtils, documentUtils, effectUtils, workflowUtils} from '../../../../proxy.mjs';
async function moved({document, token}) {
    if (!token.inCombat || !combatUtils.isOwnTurn(token) || !document.system.uses.value) return;
    const activity = document.system.activities.contents[0];
    if (!activity) return;
    const activityData = activity.toObject();
    activityData.effects = [];
    activityData.activation.type = '';
    await workflowUtils.syntheticActivityDataRoll(activityData, document, [], {options: {workflowOptions: {steadyAimLockout: true}}});
}
async function use({document, workflow}) {
    if (workflow.workflowOptions?.steadyAimLockout) return;
    if (actorUtils.getItemByIdentifier(workflow.actor, 'infiltration-expertise')) return;
    const sourceEffect = documentUtils.getEffectByIdentifier(document, 'steady-aim-movement');
    if (!sourceEffect) return;
    const effectData = documentUtils.getEffectData(document, sourceEffect.id);
    await effectUtils.createEffects(workflow.actor, [effectData]);
}
export const steadyAim = {
    name: 'Steady Aim',
    version: '2.0.4',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    move: [
        {
            pass: 'actorMoved',
            macro: moved,
            priority: 50
        }
    ]
};
