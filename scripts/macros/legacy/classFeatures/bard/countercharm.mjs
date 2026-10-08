import {actorUtils, documentUtils, effectUtils} from '../../../../proxy.mjs';
async function begin({workflow}) {
    const sourceEffect = workflow.item.effects.find(effect => documentUtils.getIdentifier(effect) === 'counterCharmEffect');
    if (!sourceEffect) return;
    for (const effect of actorUtils.getEffects(workflow.actor)) {
        if (effect.origin !== sourceEffect.uuid && documentUtils.getIdentifier(effect) !== 'counterCharmEffect') continue;
        return await effectUtils.resetDuration(effect);
    }
    const effectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id, {duration: sourceEffect.duration});
    await effectUtils.createEffects(workflow.actor, [effectData]);
}
export const countercharm = {
    name: 'Countercharm',
    version: '2.0.3',
    rules: '2014',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: begin,
            priority: 50
        }
    ]
};
