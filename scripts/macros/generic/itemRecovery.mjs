import {actorUtils, automationUtils, documentUtils, itemUtils, Logging} from '../../proxy.mjs';
export async function addItemRecovery(feature, targetIdentifier, recovery) {
    const target = actorUtils.getItemByIdentifier(feature.actor, targetIdentifier);
    if (!target) return Logging.addMacroWarning('chris-premades', documentUtils.getIdentifier(feature), 'Target item not found on actor: ' + targetIdentifier);
    const identifier = 'recovery-' + documentUtils.getIdentifier(feature);
    const existing = documentUtils.getEffectByIdentifier(target, identifier);
    if (existing && foundry.utils.equals(existing.system.changes[0]?.value, [recovery])) return;
    if (existing) await documentUtils.deleteDocument(existing);
    const effectData = documentUtils.getBaseEffectData(feature, {
        name: feature.name,
        img: feature.img,
        origin: feature.uuid,
        identifier,
        parentEntity: feature,
        changes: [{key: 'system.uses.recovery', type: 'add', value: [recovery], priority: 20}]
    });
    await itemUtils.enchantItem(target, effectData);
}
async function added({document}) {
    const {identifier, period, formula} = automationUtils.getGenericConfigValues(document, 'chris-premades', 'itemRecovery', ['identifier', 'period', 'formula']);
    if (!identifier) return;
    await addItemRecovery(document, identifier, formula ? {period, type: 'formula', formula} : {period, type: 'recoverAll'});
}
/**
 * Gives another item on the actor an extra uses recovery entry through an enchantment. The enchantment is replaced when
 * the recovery changes.
 */
export const itemRecovery = {
    version: '2.1.0',
    rules: 'all',
    category: 'uses',
    generic: true,
    documents: ['item'],
    item: [
        {pass: 'created', macro: added, priority: 50},
        {pass: 'medkit', macro: added, priority: 50},
        {pass: 'munched', macro: added, priority: 50}
    ],
    genericConfig: {
        identifier: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Identifier',
            hint: 'CHRISPREMADES.Macros.Generic.ItemRecovery.Identifier.Hint'
        },
        period: {
            default: 'initiative',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ItemRecovery.Period.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ItemRecovery.Period.Hint',
            get options() { return Object.entries(CONFIG.DND5E.limitedUsePeriods).map(([value, {label}]) => ({value, label})); }
        },
        formula: {
            default: '',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Formula',
            hint: 'CHRISPREMADES.Macros.Generic.ItemRecovery.Formula.Hint'
        }
    }
};
