import {actorUtils, constants, effectUtils, genericUtils, itemUtils, rollUtils, socketUtils} from '../../utils.js';
import {socket, sockets} from '../sockets.js';
async function bonusDamage(workflow, formula, {ignoreCrit = false, damageType}={}) {
    formula = String(formula);
    if (workflow.isCritical && !ignoreCrit) formula = await rollUtils.getCriticalFormula(formula, workflow.activity.getRollData());
    let roll = await new CONFIG.Dice.DamageRoll(formula, workflow.activity.getRollData()).evaluate();
    if (damageType) {
        genericUtils.setProperty(roll, 'options.type', damageType);
    } else {
        genericUtils.setProperty(roll, 'options.type', roll.terms[0].flavor);
    }
    workflow.damageRolls.push(roll);
    await workflow.setDamageRolls(workflow.damageRolls);
}
async function bonusAttack(workflow, formula) {
    let roll = await rollUtils.addToRoll(workflow.attackRoll, formula, {rollData: workflow.activity.getRollData()});
    await workflow.setAttackRoll(roll);
}
async function replaceDamage(workflow, formula, {ignoreCrit = false, damageType} = {}) {
    formula = String(formula);
    if (workflow.isCritical && !ignoreCrit) formula = await rollUtils.getCriticalFormula(formula, workflow.activity.getRollData());
    let roll = await new CONFIG.Dice.DamageRoll(formula, workflow.activity.getRollData()).evaluate();
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
async function completeActivityUse(activity, config={}, dialog={}, message={}) {
    if (!config.midiOptions?.asUser && !socketUtils.hasPermission(activity.actor, game.userId)) {
        if (!config.midiOptions) config.midiOptions = {};
        config.midiOptions.asUser = socketUtils.firstOwner(activity.actor, true);
        config.midiOptions.checkGMStatus = true;
    }
    let workflow = await MidiQOL.completeActivityUse(activity, config, dialog, message);
    return workflow.workflow ?? workflow;
}
async function completeItemUse(item, config = {}, options = {}) {
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
    config.midiOptions = genericUtils.mergeObject(config.midiOptions ?? {}, options);
    let workflow = await MidiQOL.completeItemUse(item, config);
    if (fixSets) {
        if (workflow.failedSaves) workflow.failedSaves = new Set(workflow.failedSaves);
        if (workflow.hitTargets) workflow.hitTargets = new Set(workflow.hitTargets);
        if (workflow.targets) workflow.targets = new Set(workflow.targets);
    }
    return workflow;
}
async function syntheticActivityRoll(activity, targets = [], {options = {}, config = {}, atLevel = undefined, consumeUsage = false, consumeResources = false, dialog = {}, message = {}} = {}) {
    let defaultConfig = {
        consumeUsage,
        consumeSpellSlot: false,
        consume: {
            resources: consumeResources
        }
    };
    let autoRollDamage = MidiQOL.configSettings().autoRollDamage;
    if (!['always', 'onHit'].includes(autoRollDamage)) autoRollDamage = 'onHit';
    let defaultOptions = {
        targetUuids: targets.map(i => i.document.uuid),
        configureDialog: false,
        //ignoreUserTargets: true,
        workflowOptions: {
            autoRollDamage,
            autoFastDamage: true,
            autoRollAttack: true
        }
    };
    if (atLevel) {
        let spellLabel = actorUtils.getEquivalentSpellSlotName(activity.actor, atLevel);
        if (spellLabel) defaultConfig.spell = {slot: spellLabel};
    }
    options = genericUtils.mergeObject(defaultOptions, options);
    config = genericUtils.mergeObject(defaultConfig, config);
    config.midiOptions = options;
    return await completeActivityUse(activity, config, dialog, message);
}
async function syntheticItemRoll(item, targets, {options = {}, config = {}, userId, consumeUsage = false, consumeResources = false} = {}) {
    let defaultConfig = {
        consumeUsage,
        consumeSpellSlot: false,
        consume: {
            resources: consumeResources
        }
    };
    let autoRollDamage = MidiQOL.configSettings().autoRollDamage;
    if (!['always', 'onHit'].includes(autoRollDamage)) autoRollDamage = 'onHit';
    let defaultOptions = {
        targetUuids: targets.map(i => i.document.uuid),
        configureDialog: false,
        //ignoreUserTargets: true,
        workflowOptions: {
            autoRollDamage,
            autoFastDamage: true,
            autoRollAttack: true
        }
    };
    options = genericUtils.mergeObject(defaultOptions, options);
    config = genericUtils.mergeObject(defaultConfig, config);
    if (userId) genericUtils.setProperty(options, 'asUser', userId);
    return await completeItemUse(item, config, options);
}
async function syntheticItemDataRoll(itemData, actor, targets, {options = {}, config = {}, killAnim = false} = {}) {
    if (killAnim) genericUtils.mergeObject(itemData, {'flags.autoanimations': {
        isEnabled: false,
        isCustomized: false,
        fromAmmo: false,
        version: 5
    }});
    let hasPermission = socketUtils.hasPermission(actor, game.user.id);
    if (hasPermission) {
        let item = await itemUtils.syntheticItem(itemData, actor);
        return await syntheticItemRoll(item, targets, {options, config});
    } else {
        let workflowData = await socket.executeAsGM(sockets.syntheticItemDataRoll.name, itemData, actor.uuid, targets.map(i => i.document.uuid), {options, config});
        if (workflowData.failedSaves) workflowData.failedSaves = new Set(workflowData.failedSaves);
        if (workflowData.hitTargets) workflowData.hitTargets = new Set(workflowData.hitTargets);
        if (workflowData.targets) workflowData.targets = new Set(workflowData.targets);
        return workflowData;
    }
}
async function syntheticActivityDataRoll(activityData, item, actor, targets, {options = {}, config = {}, atLevel = undefined, consumeUsage = false, consumeResources = false} = {}) {
    let itemData = genericUtils.duplicate(item.toObject());
    itemData.system.activities[activityData.id] = activityData;
    let newItem = await itemUtils.syntheticItem(itemData, actor);
    let newActivity = newItem.system.activities.get(activityData._id);
    return await syntheticActivityRoll(newActivity, targets, {options, config, atLevel, consumeUsage, consumeResources});
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
function preventDeath(ditem) {
    ditem.totalDamage = ditem.oldHP - 1;
    ditem.newHP = 1;
    ditem.newTempHP = 0;
    ditem.hpDamage = ditem.totalDamage;
    ditem.damageDetail.forEach(i => i.value = 0);
    ditem.damageDetail[0].value = ditem.totalDamage;
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
function getCastLevel(workflow) {
    return Math.max(workflow.castData.castLevel, workflow.castData.baseLevel);
}
async function specialItemUse(item, targets, sourceFeature, {activity, consumeUsage = false, consumeResources = false} = {}) {
    let effectData = {
        name: sourceFeature.name,
        img: constants.tempConditionIcon,
        changes: Object.keys(CONFIG.DND5E.activityTypes).flatMap(i => ([{
            key: 'activities[' + i + '].activation.type',
            mode: 5,
            value: 'special',
            priority: 20
        },
        {
            key: 'system.activation.type',
            mode: 5,
            value: 'special',
            priority: 20
        }])),
        duration: {
            seconds: 1
        },
        origin: sourceFeature.uuid
    };
    let effect = await itemUtils.enchantItem(item, effectData);
    if (!activity) {
        await syntheticItemRoll(item, targets, {consumeUsage, consumeResources});
    } else {
        await syntheticActivityRoll(activity, targets, {consumeUsage, consumeResources});
    }
    await genericUtils.remove(effect);
}
async function updateTargets(workflow, targets, {userId} = {}) {
    workflow.targets = new Set(targets);
    await genericUtils.updateTargets(targets, userId);
}
async function removeTargets(workflow, tokens, {userId} = {}) {
    let targets = Array.from(workflow.targets).filter(token => !tokens.includes(token));
    workflow.targets = new Set(targets);
    await genericUtils.updateTargets(targets, userId);
}
function getActionType(workflow) {
    return workflow.activity.getActionType(workflow.attackMode);
}
function isAttackType(workflow, type = 'attack') {
    if (!workflow.activity) return;
    let field;
    switch (type) {
        case 'attack': field = 'attacks'; break;
        case 'meleeAttack': field = 'meleeAttacks'; break;
        case 'rangedAttack': field = 'rangedAttacks'; break;
        case 'weaponAttack': field = 'weaponAttacks'; break;
        case 'spellAttack': field = 'spellAttacks'; break;
        case 'rangedWeaponAttack': field = 'rangedWeaponAttacks'; break;
        case 'meleeWeaponAttack': field = 'meleeWeaponAttacks'; break;
        default: return;
    }
    return constants[field].includes(getActionType(workflow));
}
async function swapAttackAbility(workflow, ability = 'cha', {validTypes = ['str', 'dex'], checkHigher = true} = {}) {
    if (!workflow.activity) return;
    let itemAbility = workflow.activity.attack.ability;
    if (!itemAbility.length) itemAbility = 'str';
    if (workflow.item.system.properties.has('fin') && itemAbility === 'str') {
        if (workflow.actor.system.abilities.dex.mod >= workflow.actor.system.abilities.str.mod) itemAbility = 'dex';
    }
    if (!validTypes.includes(itemAbility)) return;
    let actorAbilityMod = workflow.actor.system.abilities[ability].mod;
    if (checkHigher) {
        if (actorAbilityMod < workflow.actor.system.abilities[itemAbility].mod) return;
    }
    let itemData = genericUtils.duplicate(workflow.item.toObject());
    itemData.system.activities[workflow.activity.id].attack.ability = ability;
    workflow.item = await itemUtils.syntheticItem(itemData, workflow.actor);
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}
function addEntityRemoval(workflow, entities) {
    let current = workflow['chris-premades']?.removeEntityUuids ?? [];
    genericUtils.setProperty(workflow, 'chris-premades.removeEntityUuids', [...current, ...entities.map(i => i.uuid)]);
}

/**
 * Updates a single damage instance inside a Midi-QoL damage item and
 * recalculates all resulting damage totals and HP/temp HP changes.
 *
 * This function:
 *  • Sets the given damage instance’s value to the new adjusted damage.
 *  • Marks the instance as modified (if applicable).
 *  • Recomputes the item's totalDamage based on all damageDetail entries.
 *  • Updates helper mirrors (elwinHelpersEffectiveDamage,
 *    healingAdjustedTotalDamage) if they were previously in use.
 *  • Recalculates temp HP consumption, HP damage, newTempHP, and newHP based
 *    on oldTempHP, oldHP, and the newly computed total damage.
 *
 * Mutates `damageItem` and `damageInstance` in place.
 *
 * @param {Object} damageItem - The Midi-QoL damage item being modified (ditem).
 * @param {Object} damageInstance - One entry from damageItem.damageDetail to update.
 * @param {number} newValue - The new damage value for this instance after mitigation.
 * @returns {void} This function does not return a value; it mutates the provided objects.
*/
function adjustDamageItem(damageItem, damageInstance, newValue) {
    if (!damageItem || !damageInstance) return;
    genericUtils.log("dev",`old detail damage:`,damageItem, "old damage instance:", damageInstance);
    damageInstance.value = genericUtils.sanitizeNumber(newValue); //Redundant but defensive sanitization

    if (damageInstance.active) {
        damageInstance.active.modification = true;
    }

    // --- Recompute total damage safely ---
    const detail = Array.isArray(damageItem.damageDetail) ? damageItem.damageDetail : [];
    let newTotalDamage = detail.reduce((sum, d) => {
        const safeV = genericUtils.sanitizeNumber(d?.value ?? 0);
        return sum + safeV;
    }, 0);
    genericUtils.log("dev",`new Total Damage: ${newTotalDamage}`);
    damageItem.totalDamage = newTotalDamage;
    workflowUtils.applyNewTotalDamage(damageItem, newTotalDamage);
    genericUtils.log("dev",`new detail damage:`,damageItem, "new damage instance:", damageInstance);
}


/**
 * This function adjusts the damage value based on the order of application of
 * damage reduction, saves, resistances, vulnerabilities and immunities.
 * 
 * @param {Object} params
 * @param {Object} params.damageInstance - A ditem?.damageDetail entry.
 * @param {number} [params.damageMod=0] - The damage modification to apply.
 * @param {string} [params.orderOfDamage="DRSaveDr"] - The MIDI saveDROrder setting.
 * @returns {number} The adjusted damage, floored and clamped to >= 0.
*/
function adjustDamageValue({damageInstance, damageMod = 0, orderOfDamage = "DRSaveDr"}) {

    if (!damageInstance) return 0;

    const base = genericUtils.sanitizeNumber(damageInstance.damage ?? 0);
    const final = genericUtils.sanitizeNumber(damageInstance.value ?? 0);

    const saved = damageInstance.active?.saved ?? false;
    const resistant = damageInstance.active?.resistance ?? false;
    const vulnerable = damageInstance.active?.vulnerability ?? false;
    const immune = damageInstance.active?.immunity ?? false;

    if (immune) return 0;

    const saveMult = saved ? 0.5 : 1;
    const resistMult = resistant ? 0.5 : 1;
    const vulnMult = vulnerable ? 2 : 1;

    const finalMultiplier = saveMult * resistMult * vulnMult;

    // Compute customMods, a damage modification the multiplier may not reflect, such as system.traits.dm.amount.x
    // it doesn't apply to specific dm.midi, which are added to the damageDetail Array so we don't need to compute it
    let customMods = 0;
    let newValue = 0;

    if (orderOfDamage === "DRSaveDr") {
        // final = (base + customMods) * finalMultiplier
        customMods = final / finalMultiplier - base;
        genericUtils.log("dev",`customMod applied to damage was ${customMods}`);
        // apply new mod
        newValue = (base + customMods + damageMod) * finalMultiplier;
    }
    else {
        // alternate order:
        // final = ((base * saveMult) + customMods) * (resistMult * vulnMult)
        const afterSave = base * saveMult;
        const resistVulnMult = resistMult * vulnMult;

        customMods = (final / resistVulnMult) - afterSave;
        genericUtils.log("dev",`customMod applied to damage was ${customMods}`);

        newValue = ((base * saveMult) + customMods + damageMod) * resistVulnMult;
    }

    newValue = Math.floor(newValue);

    return newValue;
}

/**
 * Apply a new total damage value to a damageItem, updating:
 * - helper mirrors (if they were in use)
 * - temp HP / HP / hpDamage / tempDamage
 *
 * @param {object} damageItem
 * @param {number} newTotalDamage
 */
function applyNewTotalDamage(damageItem, newTotalDamage) {
    genericUtils.log("dev", "damageItem inspection:", damageItem, "new TotalDamage:", newTotalDamage);
    if (!damageItem) return;

    const total = genericUtils.sanitizeNumber(newTotalDamage);
    const roundedTotal = total > 0 ? Math.floor(total) : Math.ceil(total);

    // Mirror helpers
    if (damageItem?.elwinHelpersEffectiveDamage !== undefined)
        damageItem.elwinHelpersEffectiveDamage = roundedTotal;
    
    // Mirror healing-adjusted helper (damage or healing)
    if (damageItem?.healingAdjustedTotalDamage !== undefined)
        damageItem.healingAdjustedTotalDamage = roundedTotal;

    // HP / Temp HP logic
    const oldTemp = Math.max(0, genericUtils.sanitizeNumber(damageItem.oldTempHP ?? 0));
    const oldHP = Math.max(0, genericUtils.sanitizeNumber(damageItem.oldHP ?? 0));

    if (oldTemp >= roundedTotal) {
        damageItem.newTempHP = oldTemp - roundedTotal;
        damageItem.tempDamage = roundedTotal;
        damageItem.hpDamage = 0;
        damageItem.newHP = oldHP;
    }
    else if (oldTemp > 0) {
        const hpDamage = Math.min(roundedTotal - oldTemp, oldHP);
        damageItem.newTempHP = 0;
        damageItem.tempDamage = oldTemp;
        damageItem.hpDamage = hpDamage;
        damageItem.newHP = Math.max(0, oldHP - hpDamage);
    }
    else {
        const hpDamage = Math.min(roundedTotal, oldHP);
        damageItem.newTempHP = 0;
        damageItem.tempDamage = 0;
        damageItem.hpDamage = hpDamage;
        damageItem.newHP = Math.max(0, oldHP - hpDamage);
    }
}

/**
 * Returns the single damageDetail entry with the highest effective `damage` value.
 * If `type` is provided, restricts to that type; otherwise considers all.
 */
function getHighestDamageInstance(damageDetail = [], type = null) {
    const entries = type
        ? damageDetail.filter(d => d?.type === type)
        : damageDetail;

    if (!entries.length) return null;

    return entries.reduce((max, d) =>
        (d?.value ?? 0) > (max?.value ?? 0) ? d : max
    , null);
};

/**
 * Returns the effective damage of a specific type after all reductions,
 * saves, resistances, vulnerabilities, and multipliers have been applied.
 *
 * Use this for effects that trigger on damage *dealt* (RAW), not damage rolled.
 *
 * @param {Array<Object>} damageDetail - The processed workflow damageDetail.
 * @param {string} type - The damage type to total.
 * @returns {number} Effective damage of that type (0 if none).
 */
function getTotalEffectiveDamageOfType(damageDetail, type) {
    if (!Array.isArray(damageDetail)) return 0;
    return damageDetail
        .filter(d => d?.type === type && typeof d.value === "number")
        .reduce((total, d) => total + d.value, 0);
}

export let workflowUtils = {
    bonusDamage,
    bonusAttack,
    replaceDamage,
    applyDamage,
    completeActivityUse,
    completeItemUse,
    syntheticActivityRoll,
    syntheticItemRoll,
    syntheticItemDataRoll,
    negateDamageItemDamage,
    setDamageItemDamage,
    applyWorkflowDamage,
    getDamageTypes,
    getTotalDamageOfType,
    handleInstantTemplate,
    getCastData,
    modifyDamageAppliedFlat,
    getCastLevel,
    syntheticActivityDataRoll,
    specialItemUse,
    updateTargets,
    removeTargets,
    isAttackType,
    getActionType,
    swapAttackAbility,
    addEntityRemoval,
    preventDeath,
    adjustDamageItem,
    adjustDamageValue,
    applyNewTotalDamage,
    getHighestDamageInstance,
    getTotalEffectiveDamageOfType
};