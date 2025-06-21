import {custom} from './custom.js';
import {actorUtils, combatUtils, effectUtils, genericUtils, itemUtils, macroUtils, socketUtils, tokenUtils} from '../utils.js';
import {movementEvents} from './movement.js';
function getAuraMacroData(entity) {
    return entity.flags['chris-premades']?.macros?.aura ?? [];
}
function collectAuraMacros(entity) {
    let macroList = [];
    macroList.push(...getAuraMacroData(entity));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i, genericUtils.getRules(entity))).filter(j => j);
}
function collectTokenMacros(token, pass, target) {
    let distance;
    let triggers = [];
    function checkValid(macro, token, target) {
        if (macro.conscious) {
            if (!token.actor.system.attributes.hp.value) return;
            if (effectUtils.getEffectByStatusID(token.actor, 'unconscious') || effectUtils.getEffectByStatusID(token.actor, 'dead')) return;
        }
        if (macro.distance === 'paladin') {
            let paladinLevels = token.actor.classes?.paladin?.system?.levels;
            if (!paladinLevels) return;
            let maxRange = paladinLevels >= 18 ? genericUtils.handleMetric(30) : genericUtils.handleMetric(10);
            if (maxRange < distance) return;
        } else if (genericUtils.handleMetric(macro.distance) < distance) return;
        if (macro.disposition) {
            if (macro.disposition === 'ally' && token.disposition != target?.disposition) return;
            if (macro.disposition === 'enemy' && token.disposition === target?.disposition) return;
        }
        return true;
    }
    if (token.actor) {
        let effects = actorUtils.getEffects(token.actor, {includeItemEffects: true});
        effects.forEach(effect => {
            let macroList = collectAuraMacros(effect).filter(i => i.aura?.find(j => j.pass === pass)).flatMap(k => k.aura).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(effect, 'aura', {pass}));
            if (!macroList.length) return;
            if (isNaN(distance) && target) distance = tokenUtils.getDistance(token.object, target.object, {wallsBlock: true, checkCover: genericUtils.getCPRSetting('movementPerformance') === 3});
            if (distance < 0) return;
            let validAuraMacros = [];
            macroList.forEach(i => {
                if (!checkValid(i, token, target)) return;
                validAuraMacros.push({
                    macro: i.macro,
                    priority: i.priority,
                    identifier: i.identifier
                });
            });
            if (!validAuraMacros.length) return;
            triggers.push({
                entity: effect,
                castData: {
                    castLevel: effectUtils.getCastLevel(effect) ?? -1,
                    baseLevel: effectUtils.getBaseLevel(effect) ?? -1,
                    saveDC: effectUtils.getSaveDC(effect) ?? -1
                },
                macros: validAuraMacros,
                name: effect.name.slugify(),
                token: token.object,
                target: target?.object,
                distance: distance
            });
        });
        let inCombat = combatUtils.inCombat();
        token.actor.items.forEach(item => {
            if (!inCombat && itemUtils.getConfig(item, 'combatOnly')) return;
            let macroList = collectAuraMacros(item).filter(i => i.aura?.find(j => j.pass === pass)).flatMap(k => k.aura).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(item, 'aura', {pass}));
            if (!macroList.length) return;
            if (isNaN(distance) && target) distance = tokenUtils.getDistance(token.object, target.object, {wallsBlock: true, checkCover: genericUtils.getCPRSetting('movementPerformance') === 3});
            if (distance < 0) return;
            let validAuraMacros = [];
            macroList.forEach(i => {
                if (!checkValid(i, token, target)) return;
                validAuraMacros.push({
                    macro: i.macro,
                    priority: i.priority,
                    identifier: i.identifier
                });
            });
            if (!validAuraMacros.length) return;
            triggers.push({
                entity: item,
                castData: {
                    castLevel: -1,
                    saveDC: itemUtils.getSaveDC(item) ?? -1
                },
                macros: validAuraMacros,
                name: item.name.slugify(),
                token: token.object,
                target: target?.object,
                distance: distance
            });
        });
    }
    return triggers;
}
function getSortedTriggers(tokens, pass, token) {
    let allTriggers = [];
    tokens.forEach(i => {
        allTriggers.push(...collectTokenMacros(i, pass, token));
    });
    let names = new Set(allTriggers.map(i => i.name));
    allTriggers = Object.fromEntries(names.map(i => [i, allTriggers.filter(j => j.name === i)]));
    let maxMap = {};
    names.forEach(i => {
        let maxLevel = Math.max(...allTriggers[i].map(i => i.castData.castLevel));
        let maxDC = Math.max(...allTriggers[i].map(i => i.castData.saveDC));
        maxMap[i] = {
            maxLevel: maxLevel,
            maxDC: maxDC
        };
    });
    let triggers = [];
    names.forEach(i => {
        let maxLevel = maxMap[i].maxLevel;
        let maxDC = maxMap[i].maxDC;
        let maxDCTrigger = allTriggers[i].find(j => j.castData.saveDC === maxDC);
        let selectedTrigger;
        if (maxDCTrigger.castData.castLevel === maxLevel) {
            selectedTrigger = maxDCTrigger;
        } else {
            selectedTrigger = allTriggers[i].find(j => j.castData.castLevel === maxLevel);
        }
        triggers.push(selectedTrigger);
    });
    let sortedTriggers = [];
    triggers.forEach(trigger => {
        trigger.macros.forEach(macro => {
            sortedTriggers.push({
                entity: trigger.entity,
                castData: trigger.castData,
                macro: macro.macro,
                priority: macro.priority,
                identifier: macro.identifier,
                name: trigger.name,
                token: trigger.token,
                target: trigger.target,
                distance: trigger.distance,
                macroName: typeof macro.macro === 'string' ? 'Embedded' : macro.macro.name
            });
        });
    });
    return sortedTriggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger, options) {
    try {
        if (typeof trigger.macro === 'string') {
            genericUtils.log('dev', 'Executing Embedded Aura Macro: ' + trigger.macroName);
            return await custom.executeScript({script: trigger.macro, trigger, options});
        } else {
            genericUtils.log('dev', 'Executing Aura Macro: ' + trigger.macroName);
            return await trigger.macro({trigger, options});
        }
    } catch (error) {
        console.error(error);
    }
}
async function executeMacroPass(tokens, pass, token, options) {
    genericUtils.log('dev', 'Executing Aura Macro Pass: ' + pass + ' for ' + token.name);
    let triggers = getSortedTriggers(tokens, pass, token);
    let removedEffects = [];
    let effects = actorUtils.getEffects(token.actor).filter(j => j.flags['chris-premades']?.aura);
    await Promise.all(effects.map(async effect => {
        if (!effect.origin) return;
        let identifier = genericUtils.getIdentifier(effect);
        if (!identifier) {
            removedEffects.push(effect);
            return;
        }
        let trigger = triggers.find(k => k.identifier === identifier);
        if (!trigger) {
            removedEffects.push(effect);
            return;
        }
        if (trigger.entity.uuid != effect.origin) removedEffects.push(effect);
    }));
    let removedEffectIds = removedEffects.map(i => i.id);
    await genericUtils.deleteEmbeddedDocuments(token.actor, 'ActiveEffect', removedEffectIds);
    let effectDataArray = [];
    let effectOptionsArray = [];
    for (let i of triggers) {
        let newEffectInfo = await executeMacro(i, options);
        if (newEffectInfo) {
            effectDataArray.push(newEffectInfo.effectData);
            effectOptionsArray.push(newEffectInfo.effectOptions);
        }
    }
    if (effectDataArray.length) await effectUtils.createEffects(token.actor, effectDataArray, effectOptionsArray);
}
async function updateAuras(token, options) {
    let effect = actorUtils.getEffects(token.actor).find(i => i.flags['chris-premades']?.macros?.aura);
    let item = token.actor.items.find(i => i.flags['chris-premades']?.macros?.aura);
    if (effect || item) {
        await Promise.all(token.parent.tokens.map(async i => await executeMacroPass(token.parent.tokens, 'create', i, options)));
    } else {
        await executeMacroPass(token.parent.tokens, 'create', token, options);
    }
}
async function createToken(token, options, userId) {
    if (!socketUtils.isTheGM()) return;
    if (!token.actor) return;
    await updateAuras(token);
    await movementEvents.executeMacroPass([token], 'create', undefined, options);
    await movementEvents.executeMacroPass(token.parent.tokens.filter(i => i != token), 'sceneCreate', token, options);
}
async function deleteToken(token, options, userId) {
    if (!socketUtils.isTheGM()) return;
    if (!token.actor) return;
    let effect = actorUtils.getEffects(token.actor).find(i => i.flags['chris-premades']?.aura);
    if (effect) {
        await Promise.all(token.parent.tokens.filter(j => j != token).map(async i => await executeMacroPass(token.parent.tokens.filter(j => j != token), 'create', i, options)));
    } else {
        await executeMacroPass(token.parent.tokens, 'create', token, options);
    }
    await movementEvents.executeMacroPass([token], 'deleted', undefined, options);
    await movementEvents.executeMacroPass(token.parent.tokens.filter(i => i != token), 'sceneDeleted', token, options);
}
async function canvasReady(canvas) {
    if (!socketUtils.isTheGM() || !canvas.scene) return;
    await Promise.all(canvas.scene.tokens.filter(j => j.actor).map(async i => await executeMacroPass(canvas.scene.tokens, 'create', i)));
}
async function effectCheck(effect) {
    let shouldUpdate = effect.flags['chris-premades']?.macros?.aura;
    shouldUpdate = shouldUpdate || ['dead', 'unconscious'].some(i => effect.statuses.has(i));
    if (!shouldUpdate) return;
    await Promise.all(canvas.scene.tokens.map(async i => await executeMacroPass(canvas.scene.tokens, 'create', i)));
}
export let auras = {
    updateAuras,
    canvasReady,
    createToken,
    deleteToken,
    effectCheck
};
