import {actorUtils, combatUtils, documentUtils, effectUtils} from '../../../../proxy.mjs';
async function moved({document, token}) {
    if (!token.inCombat || !combatUtils.isOwnTurn(token) || !document.system.uses.value) return;
    await documentUtils.update(document, {'system.uses.spent': document.system.uses.spent + 1});
}
async function use({document, actor}) {
    const infiltrationExpertise = actorUtils.getItemByIdentifier(actor, 'infiltrationExpertise');
    if (infiltrationExpertise) return;
    const sourceEffect = documentUtils.getEffectByIdentifier(document, 'steadyAimMovement');
    if (!sourceEffect) return;
    const effectData = documentUtils.getEffectData(document, sourceEffect.id);
    await effectUtils.createEffects(actor, [effectData]);
}
export const steadyAim = {
    name: 'Steady Aim',
    version: '2.0.3',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    movement: [
        {
            pass: 'actorMoved',
            macro: moved,
            priority: 50
        }
    ]
};