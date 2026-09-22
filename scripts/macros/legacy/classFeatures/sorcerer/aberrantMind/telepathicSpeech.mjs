import {documentUtils, effectUtils} from '../../../../../proxy.mjs';
async function use({document, workflow}) {
    const [casterEffect, targetEffect] = document.effects.filter(effect => !effect.transfer);
    if (!casterEffect || !targetEffect) return;
    const [effect] = await effectUtils.createEffects(workflow.actor, [documentUtils.getEffectData(workflow.activity, casterEffect.id, {activityUuid: workflow.activity.uuid})]);
    if (!effect) return;
    const targetEffectData = documentUtils.getEffectData(workflow.activity, targetEffect.id, {activityUuid: workflow.activity.uuid});
    await Promise.all(Array.from(workflow.targets, async target => await effectUtils.createEffects((target.document ?? target).actor, [targetEffectData], {parentEntity: effect})));
}
export const telepathicSpeech = {
    name: 'Telepathic Speech',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ]
};
