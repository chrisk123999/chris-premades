import {documentUtils, effectUtils, Logging} from '../../../../../proxy.mjs';
async function halve({document: activity}) {
    const effect = documentUtils.getEffectByIdentifier(activity.item, 'elementalRebuke');
    if (!effect) return Logging.addMacroWarning('CPR', 'elemental-rebuke', 'Elemental Rebuke effect is missing from the item.', {notify: 'warn'});
    await effectUtils.createEffects(activity.actor, [documentUtils.getEffectData(activity.item, effect.id)]);
}
export const elementalRebuke = {
    name: 'Elemental Rebuke',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: halve,
            priority: 50
        }
    ]
};
