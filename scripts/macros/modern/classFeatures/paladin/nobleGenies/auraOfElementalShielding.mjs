import {automationUtils, constants, dialogUtils, documentUtils, Logging, queryUtils} from '../../../../../proxy.mjs';
async function setType(item, {initial = false} = {}) {
    const effect = documentUtils.getEffectByIdentifier(item, 'auraOfElementalShieldingAura');
    if (!effect) return Logging.addMacroWarning('CPR', 'aura-of-elemental-shielding', 'Aura of Elemental Shielding effect is missing from the item.', {notify: 'warn'});
    const changes = effect.toObject().system.changes;
    const change = changes.find(entry => entry.key === 'system.traits.dr.value');
    if (!change) return;
    let type = automationUtils.getConfigValue(item, 'damageType');
    if (!type) {
        const types = automationUtils.getConfigValue(item, 'damageTypes').filter(damageType => initial || damageType !== change.value);
        type = await dialogUtils.selectDamageType(types, item.name, 'CHRISPREMADES.Macros.Modern.AuraOfElementalShielding.Select', {addNo: !initial, userId: queryUtils.firstOwner(item.actor, true)});
    }
    if (!type || type === change.value) return;
    change.value = type;
    await documentUtils.update(effect, {'system.changes': changes});
}
async function created({document: item}) {
    if (item.actor) await setType(item, {initial: true});
}
async function turnStart({document: item}) {
    await setType(item);
}
export const auraOfElementalShielding = {
    name: 'Aura of Elemental Shielding',
    version: '2.1.4',
    rules: '2024',
    item: [
        {
            pass: 'created',
            macro: created,
            priority: 50
        },
        {
            pass: 'medkit',
            macro: created,
            priority: 50
        }
    ],
    combat: [
        {
            pass: 'actorTurnStart',
            macro: turnStart,
            priority: 50
        }
    ],
    config: {
        damageType: {
            default: '',
            type: 'select',
            label: 'CHRISPREMADES.Config.DamageType',
            hint: 'CHRISPREMADES.Macros.Modern.AuraOfElementalShielding.DamageTypeHint',
            category: 'behavior',
            get options() { return [{value: '', label: 'CHRISPREMADES.Macros.Modern.AuraOfElementalShielding.Ask'}, ...constants.damageTypeOptions]; }
        },
        damageTypes: {
            default: ['acid', 'cold', 'fire', 'lightning', 'thunder'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.DamageTypes',
            category: 'behavior',
            get options() { return constants.damageTypeOptions; }
        }
    }
};
