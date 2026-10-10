import {actorUtils, automationUtils, D20Bonus, documentUtils, effectUtils, itemUtils, workflowUtils} from '../../../proxy.mjs';
async function skill({actor, document: item, skillId, token}) {
    const mode = automationUtils.getConfigValue(item, 'promptToUse');
    if (mode === 'never' || actor.inCombat) return;
    if (actorUtils.getEffectByIdentifier(actor, 'guidanceEffect')) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'self-use');
    const sourceEffect = documentUtils.getEffectByIdentifier(item, 'guidanceEffect');
    const formula = sourceEffect?.system.changes[0]?.value;
    if (!activity || !formula) return;
    return new D20Bonus(activity, {formula, optional: mode === 'prompt'}).withOnUse(async () => {
        await workflowUtils.completeActivityUse(activity, token ? [token] : []);
        const effectData = documentUtils.getEffectData(activity, sourceEffect.id, {parentEntity: effectUtils.getConcentrationEffect(actor, item)});
        if (!effectData) return;
        effectData.system.changes = effectData.system.changes.map(change => ({...change, key: change.key.replaceAll('{key}', 'skills.' + skillId)}));
        await effectUtils.createEffects(actor, [effectData]);
    });
}
export const guidance = {
    name: 'Guidance',
    version: '2.0.0',
    rules: '2024',
    skill: [
        {
            pass: 'actorOptionalBonus',
            macro: skill,
            priority: 250
        }
    ],
    config: {
        promptToUse: {
            default: 'prompt',
            type: 'select',
            label: 'CHRISPREMADES.Config.PromptToUse',
            category: 'behavior',
            get options() { return ['auto', 'prompt', 'never'].map(value => ({value, label: _loc('CHRISPREMADES.Macros.Modern.Guidance.Modes.' + value)})); }
        }
    }
};
