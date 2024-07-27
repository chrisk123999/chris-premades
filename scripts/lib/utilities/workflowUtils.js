import {actorUtils, effectUtils, genericUtils, itemUtils, rollUtils} from '../../utils.js';
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
async function replaceDamage(workflow, formula, {ignoreCrit = false, damageType}) {
    formula = String(formula);
    if (workflow.isCritical && !ignoreCrit) formula = await rollUtils.getCriticalFormula(formula);
    let roll = await new CONFIG.Dice.DamageRoll(formula, workflow.actor.getRollData()).evaluate();
    if (damageType) {
        genericUtils.setProperty(roll, 'options.type', damageType);
    } else {
        genericUtils.setProperty(roll, 'options.type', roll.terms[0].flavor);
    }
    await workflow.setDamageRolls([roll]);
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
        ignoreUserTargets: true,
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
    ditem.newTempHP = ditem.oldTempHP;
    ditem.hpDamage = 0;
    ditem.tempDamage = 0;
    ditem.appliedDamage = 0;
}
function applyWorkflowDamage(sourceToken, damageRoll, damageType, targets, {flavor='', itemCardId='new'}={}) {
    return new MidiQOL.DamageOnlyWorkflow(sourceToken.actor, sourceToken, damageRoll.total, damageType, targets, damageRoll, {flavor, itemCardId});
}
function getDamageTypes(damageRolls) {
    return new Set(damageRolls.map(i => i.options.type));
}
function getTotalDamageOfType(damageDetail, actor, type) {
    if (actorUtils.checkTrait(actor, 'di', type)) return 0;
    let details = damageDetail.filter(i => i.type === type);
    if (!details.length) return 0;
    let total = 0;
    for (let i of details) total += i.damage;
    if (!total) return 0;
    let resistant = actorUtils.checkTrait(actor, 'dr', type);
    let vulnerable = actorUtils.checkTrait(actor, 'dv', type);
    if (resistant && !vulnerable) total = Math.floor(total / 2);
    if (vulnerable && !resistant) total = total * 2;
    return total;
}
async function handleInstantTemplate(workflow) {
    if (!workflow.template) return;
    let templateEffectName = genericUtils.format('CHRISPREMADES.genericEffects.templateEffect', {itemName: workflow.item.name});
    let templateEffect = workflow.actor.effects.getName(templateEffectName);
    if (templateEffect) {
        await genericUtils.setFlag(templateEffect, 'chris-premades', 'macros.combat', ['removeTemplate']);
    } else {
        let effectData = {
            name: templateEffectName,
            img: workflow.item.img,
            origin: workflow.item.uuid,
            flags: {
                dnd5e: {
                    dependents: [{uuid: workflow.template.uuid}]
                }
            }
        };
        effectUtils.addMacro(effectData, 'combat', ['removeTemplate']);
        await effectUtils.createEffect(workflow.actor, effectData);
    }
}
export let workflowUtils = {
    bonusDamage,
    replaceDamage,
    applyDamage,
    completeItemUse,
    syntheticItemRoll,
    syntheticItemDataRoll,
    negateDamageItemDamage,
    applyWorkflowDamage,
    getDamageTypes,
    getTotalDamageOfType,
    handleInstantTemplate
};