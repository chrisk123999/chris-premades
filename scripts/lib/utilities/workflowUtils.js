import {genericUtils, itemUtils, rollUtils} from '../../utils.js';
async function bonusDamage(workflow, formula, {ignoreCrit = false, damageType}) {
    formula = String(formula);
    if (workflow.isCritical && !ignoreCrit) formula = await rollUtils.getCriticalFormula(formula);
    let roll = await new CONFIG.Dice.DamageRoll(formula, workflow.actor.getRollData()).evaluate();
    if (damageType) {
        genericUtils.setProperty(roll, 'options.type', damageType);
    } else {
        genericUtils.setProperty(roll, 'options.type', roll.terms[0].flavor);
    }
    workflow.damageRolls.push(roll);
    await workflow.setDamageRolls(workflow.damageRolls);
}
async function applyDamage(tokens, value, damageType) {
    return await MidiQOL.applyTokenDamage([{damage: value, type: damageType}], value, new Set(tokens));
}
async function completeItemUse(item, config, options) {
    return await MidiQOL.completeItemUse(item, config, options);
}
async function syntheticItemRoll(item, targets, {options = {}, config = {}} = {}) {
    let defaultConfig = {
        consumeUsage: false,
        consumeSpellSlot: false
    };
    let defaultOptions = {
        targetUuids: targets.map(i => i.document.uuid),
        configureDialog: false,
        workflowOptions: {
            autoRollDamage: 'always',
            autoFastDamage: true,
            autoRollAttack: true
        }
    };
    options = genericUtils.mergeObject(defaultOptions, options);
    config = genericUtils.mergeObject(defaultConfig, config);
    return await completeItemUse(item, config, options);
}
async function syntheticItemDataRoll(itemData, actor, targets, {options = {}, config = {}} = {}) {
    let item = await itemUtils.syntheticItem(itemData, actor);
    return await syntheticItemRoll(item, targets, {options, config});
}
function negateDamageItemDamage(ditem) {
    ditem.totalDamage = 0;
    ditem.newHP = ditem.oldHP;
    ditem.tempHP = ditem.oldTempHP;
    ditem.hpDamage = 0;
    ditem.appliedDamage = 0;
}
export let workflowUtils = {
    bonusDamage,
    applyDamage,
    completeItemUse,
    syntheticItemRoll,
    syntheticItemDataRoll,
    negateDamageItemDamage
};