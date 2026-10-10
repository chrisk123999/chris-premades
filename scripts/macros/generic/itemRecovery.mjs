import {actorUtils, automationUtils, documentUtils, itemUtils} from '../../proxy.mjs';
export async function addItemRecovery(feature, targetIdentifier, recovery) {
    const target = actorUtils.getItemByIdentifier(feature.actor, targetIdentifier);
    if (!target) return;
    const identifier = 'recovery-' + documentUtils.getIdentifier(feature);
    const existing = documentUtils.getEffectByIdentifier(target, identifier);
    if (existing && foundry.utils.objectsEqual(existing.system.changes[0]?.value, [recovery])) return;
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
export const itemRecovery = {
    version: '2.1.0',
    rules: 'all',
    category: 'utility',
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
            label: 'CHRISPREMADES.Config.Identifier'
        },
        period: {
            default: 'initiative',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ItemRecovery.Period',
            get options() { return Object.entries(CONFIG.DND5E.limitedUsePeriods).map(([value, {label}]) => ({value, label})); }
        },
        formula: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Formula',
            hint: 'CHRISPREMADES.Macros.Generic.ItemRecovery.FormulaHint'
        }
    }
};
