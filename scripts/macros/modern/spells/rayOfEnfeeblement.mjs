import {documentUtils, effectUtils, Logging} from '../../../proxy.mjs';
async function use({document, workflow}) {
    const savedTargets = Array.from(workflow.targets).filter(token => token.actor && !workflow.failedSaves.has(token));
    if (!savedTargets.length) return;
    const sourceEffect = documentUtils.getEffectByIdentifier(document, 'rayOfEnfeeblementBrief');
    if (!sourceEffect) return Logging.addMacroWarning('CPR', 'ray-of-enfeeblement', 'Brief Enfeeblement effect missing from item.', {notify: 'warn'});
    const effectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id, {activityUuid: workflow.activity.uuid});
    if (!effectData) return;
    await Promise.all(savedTargets.map(token => effectUtils.createEffects(token.actor, [effectData])));
}
export const rayOfEnfeeblement = {
    name: 'Ray of Enfeeblement',
    version: '2.1.3',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};
