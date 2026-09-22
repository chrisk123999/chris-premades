import {documentUtils, effectUtils} from '../../../../../proxy.mjs';
async function use({document, workflow}) {
    const sourceEffect = documentUtils.getEffectByIdentifier(document.item, 'umbralFormEffect');
    if (!sourceEffect) return;
    const effectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id, {
        activityUuid: workflow.activity.uuid,
        unhideActivities: ['dismiss'],
        favoriteActivities: true
    });
    effectUtils.pushImageChanges(effectData, document);
    await effectUtils.createEffects(workflow.actor, [effectData]);
}
async function dismiss({workflow}) {
    const effect = documentUtils.getEffectByIdentifier(workflow.actor, 'umbralFormEffect');
    if (effect) await documentUtils.deleteDocument(effect);
}
export const umbralForm = {
    name: 'Umbral Form',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'activityRollFinished', macro: use, priority: 50}
    ],
    get config() {
        return effectUtils.getImageConfig();
    }
};
export const umbralFormDismiss = {
    name: 'Umbral Form: Dismiss',
    version: umbralForm.version,
    rules: umbralForm.rules,
    roll: [
        {pass: 'activityRollFinished', macro: dismiss, priority: 50}
    ]
};
