import {actorUtils, effectUtils, genericUtils, itemUtils, rollUtils, socketUtils} from '../../utils.js';
async function bonusDamage(workflow, formula, {ignoreCrit = false, damageType}={}) {
    formula = String(formula);
    if (workflow.isCritical && !ignoreCrit) formula = await rollUtils.getCriticalFormula(formula, workflow.item.getRollData());
    let roll = await new CONFIG.Dice.DamageRoll(formula, workflow.item.getRollData()).evaluate();
    if (damageType) {
        genericUtils.setProperty(roll, 'options.type', damageType);
    } else {
        genericUtils.setProperty(roll, 'options.type', roll.terms[0].flavor);
    }
    workflow.damageRolls.push(roll);
    await workflow.setDamageRolls(workflow.damageRolls);
}
async function bonusAttack(workflow, formula) {
    let roll = await rollUtils.addToRoll(workflow.attackRoll, formula, {rollData: workflow.item.getRollData()});
    await workflow.setAttackRoll(roll);
}
async function replaceDamage(workflow, formula, {ignoreCrit = false, damageType} = {}) {
    formula = String(formula);
    if (workflow.isCritical && !ignoreCrit) formula = await rollUtils.getCriticalFormula(formula, workflow.item.getRollData());
    let roll = await new CONFIG.Dice.DamageRoll(formula, workflow.item.getRollData()).evaluate();
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
async function completeItemUse(item, config={}, options={}) {
    //let oldTargets = Array.from(game.user.targets); //Temp Fix
    let fixSets = false;
    if (!options.asUser && !socketUtils.hasPermission(item.actor, game.userId)) {
        options.asUser = socketUtils.firstOwner(item.actor, true);
        options.checkGMStatus = true;
        options.workflowData = true;
        fixSets = true;
    } else if (options.asUser && options.asUser !== game.userId) {
        options.workflowData = true;
        fixSets = true;
    }
    let workflow = await MidiQOL.completeItemUse(item, config, options);
    //genericUtils.updateTargets(oldTargets); //Temp Fix
    if (fixSets) {
        if (workflow.failedSaves) workflow.failedSaves = new Set(workflow.failedSaves);
        if (workflow.hitTargets) workflow.hitTargets = new Set(workflow.hitTargets);
        if (workflow.targets) workflow.targets = new Set(workflow.targets);
    }
    return workflow;
}
async function syntheticItemRoll(item, targets, {options = {}, config = {}} = {}) {
    let defaultConfig = {
        consumeUsage: false,
        consumeSpellSlot: false
    };
    let autoRollDamage = MidiQOL.configSettings().autoRollDamage;
    if (!['always', 'onHit'].includes(autoRollDamage)) autoRollDamage = 'onHit';
    let defaultOptions = {
        targetUuids: targets.map(i => i.document.uuid),
        configureDialog: false,
        ignoreUserTargets: true,
        workflowOptions: {
            autoRollDamage,
            autoFastDamage: true,
            autoRollAttack: true
        }
    };
    options = genericUtils.mergeObject(defaultOptions, options);
    config = genericUtils.mergeObject(defaultConfig, config);
    return await completeItemUse(item, config, options);
}
async function syntheticItemDataRoll(itemData, actor, targets, {options = {}, config = {}, killAnim = false} = {}) {
    if (killAnim) genericUtils.mergeObject(itemData, {'flags.autoanimations': {
        isEnabled: false,
        isCustomized: false,
        fromAmmo: false,
        version: 5
    }});
    let item = await itemUtils.syntheticItem(itemData, actor);
    return await syntheticItemRoll(item, targets, {options, config});
}
function negateDamageItemDamage(ditem) {
    ditem.totalDamage = 0;
    ditem.newHP = ditem.oldHP;
    ditem.newTempHP = ditem.oldTempHP;
    ditem.hpDamage = 0;
    ditem.tempDamage = 0;
    ditem.damageDetail.forEach(i => i.value = 0);
    ditem.rawDamageDetail.forEach(i => i.value = 0);
}
function setDamageItemDamage(ditem, damageAmount, adjustRaw = true) {
    ditem.totalDamage = damageAmount;
    ditem.newHP = ditem.oldHP;
    ditem.newTempHP = ditem.oldTempHP;
    ditem.hpDamage = damageAmount;
    ditem.tempDamage = damageAmount;
    ditem.damageDetail.forEach(i => i.value = 0);
    ditem.damageDetail[0].value = damageAmount;
    if (adjustRaw) {
        ditem.rawDamageDetail.forEach(i => i.value = 0);
        ditem.rawDamageDetail[0].value = damageAmount;
    }
}
function modifyDamageAppliedFlat(ditem, modificationAmount) {
    // We're gonna just assume this isn't healing, only damage
    if (modificationAmount < 0) {
        modificationAmount = Math.max(modificationAmount, -ditem.hpDamage - ditem.tempDamage);
        // if (Math.abs(modificationAmount) > ditem.hpDamage) {
        //     ditem.hpDamage = 0;
        //     let tempMod = modificationAmount + ditem.hpDamage;
        //     ditem.tempDamage += tempMod;
        // }
    // } else if (ditem.newTempHP) {
    //     let tempMod = Math.max(0, ditem.newTempHP - modificationAmount);
    //     let hpMod = -Math.min(0, ditem.newTempHP - modificationAmount);
    //     ditem.tempDamage += tempMod;
    //     ditem.hpDamage += hpMod;
    // } else {
    //     ditem.hpDamage += modificationAmount;
    }
    // ditem.hpDamage = Math.min(ditem.oldHP, ditem.damageDetail.reduce((acc, i) => acc + i.value, modificationAmount));
    // ditem.hpDamage = Math.sign(ditem.hpDamage) * Math.floor(Math.abs(ditem.hpDamage));
    ditem.damageDetail.push({
        value: modificationAmount,
        active: {multiplier: 1},
        type: 'none'
    });
    ditem.rawDamageDetail.push({
        value: modificationAmount,
        type: 'none'
    });
    let actualTotal = ditem.totalDamage + modificationAmount;
    ditem.totalDamage = actualTotal;
    let newTempHP = ditem.oldTempHP - actualTotal;
    ditem.newTempHP = Math.max(newTempHP, 0);
    ditem.newHP = Math.clamp(ditem.oldHP + Math.min(0, newTempHP), 0, ditem.oldHP);
    ditem.hpDamage = ditem.oldHP - ditem.newHP;
}
function applyWorkflowDamage(sourceToken, damageRoll, damageType, targets, {flavor = '', itemCardId = 'new', sourceItem} = {}) {
    let itemData = {};
    if (sourceItem) {
        itemData = {
            name: sourceItem.name,
            img: sourceItem.img,
            type: sourceItem.type
        };
    }
    return new MidiQOL.DamageOnlyWorkflow(sourceToken.actor, sourceToken, damageRoll.total, damageType, targets, damageRoll, {flavor, itemCardId, itemData});
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
    let templateEffectName = genericUtils.format('CHRISPREMADES.GenericEffects.TemplateEffect', {itemName: workflow.item.name});
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
function getCastData(workflow) {
    let castData = workflow.castData;
    castData.school = workflow.item.system.school;
    delete castData.itemuuid;
    return castData;
}
export let workflowUtils = {
    bonusDamage,
    bonusAttack,
    replaceDamage,
    applyDamage,
    completeItemUse,
    syntheticItemRoll,
    syntheticItemDataRoll,
    negateDamageItemDamage,
    setDamageItemDamage,
    applyWorkflowDamage,
    getDamageTypes,
    getTotalDamageOfType,
    handleInstantTemplate,
    getCastData,
    modifyDamageAppliedFlat
};