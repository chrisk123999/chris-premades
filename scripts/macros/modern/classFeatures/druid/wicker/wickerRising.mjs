import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, queryUtils} from '../../../../../proxy.mjs';
const translations = 'CHRISPREMADES.Macros.Modern.WickerRising.';
async function ward({document: item, data: {itemData}}) {
    if (itemData.system?.identifier !== 'bewitched-effigy-ward') return;
    let damageType = automationUtils.getConfigValue(item, 'damageType');
    if (!damageType) {
        const damageTypes = Object.keys(CONFIG.DND5E.damageTypes).filter(type => type !== 'force');
        damageType = await dialogUtils.selectDamageType(damageTypes, item.name, translations + 'SelectDamageType', {userId: queryUtils.firstOwner(item.actor, true)});
    }
    if (!damageType) return;
    return {changes: [{key: 'system.traits.dr.value', type: 'add', value: damageType, priority: 20}]};
}
async function soothe({document: item, data: {workflow, summon}}) {
    const targetToken = workflow.targets.first();
    if (!targetToken?.actor || !summon.actor) return;
    const {conditions, hitPointCost} = automationUtils.getConfigValues(item, ['conditions', 'hitPointCost']);
    const hp = summon.actor.system.attributes.hp.value;
    if (hp < hitPointCost) return;
    const effects = actorUtils.getStatusSources(targetToken.actor, conditions) ?? [];
    if (!effects.length) return;
    const content = _loc(translations + 'RemoveCondition', {cost: hitPointCost, name: targetToken.name});
    const selection = await dialogUtils.selectDocumentDialog(item.name, content, effects, {addNoneDocument: true, displayTooltips: true, userId: queryUtils.firstOwner(item.actor, true)});
    if (!selection) return;
    await documentUtils.deleteDocument(selection);
    await documentUtils.update(summon.actor, {'system.attributes.hp.value': hp - hitPointCost});
}
export const wickerRising = {
    name: 'Wicker Rising',
    version: '2.1.4',
    rules: '2024',
    called: [
        {
            pass: 'actorBewitchedEffigyAura',
            macro: ward,
            priority: 50
        },
        {
            pass: 'actorBewitchedEffigySoothe',
            macro: soothe,
            priority: 50
        }
    ],
    config: {
        damageType: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageType',
            hint: 'CHRISPREMADES.Macros.Modern.WickerRising.DamageTypeHint',
            get options() { return [{value: '', label: 'CHRISPREMADES.Macros.Modern.WickerRising.Ask'}, ...constants.damageTypeOptions.filter(option => option.value !== 'force')]; }
        },
        conditions: {
            default: ['charmed', 'frightened', 'paralyzed', 'poisoned', 'stunned'],
            type: 'select-many',
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.Conditions',
            get options() { return constants.statusOptions; }
        },
        hitPointCost: {
            default: 5,
            type: 'number',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Modern.WickerRising.HitPointCost',
            hint: 'CHRISPREMADES.Macros.Modern.WickerRising.HitPointCostHint'
        }
    }
};
