import * as macros from '../macros.js';
import {actorUtils, effectUtils, genericUtils, socketUtils, tokenUtils} from '../utils.js';
function getAuraMacroData(entity) {
    return entity.flags['chris-premades']?.macros?.aura ?? [];
}
function collectAuraMacros(entity) {
    let macroList = [];
    macroList.push(...getAuraMacroData(entity));
    if (!macroList.length) return [];
    return macroList.map(i => macros[i]).filter(j => j);
}
function collectTokenMacros(token, pass, distance, target) {
    let triggers = [];
    if (token.actor) {
        let effects = actorUtils.getEffects(token.actor);
        for (let effect of effects) {
            let macroList = collectAuraMacros(effect);
            if (!macroList.length) continue;
            let auraMacros = macroList.filter(i => i.aura?.find(j => j.pass === pass)).map(k => k.aura).flat().filter(l => l.pass === pass);
            auraMacros.forEach(i => {
                if (i.conscious) {
                    if (!token.actor.system.attributes.hp.value) return;
                    if (effectUtils.getEffectByIdentifier(token.actor, 'unconscious') || effectUtils.getEffectByIdentifier(token.actor, 'dead')) return;
                }
                if (i.distance === 'paladin') {
                    let paladinLevels = token.actor.classes?.paladin?.system?.levels;
                    if (!paladinLevels) return;
                    let maxRange = paladinLevels >= 18 ? 30 : 10;
                    if (maxRange < distance) return;
                } else if (i.distance < distance) return;
                if (i.disposition) {
                    if (i.disposition === 'ally' && token.disposition != target?.disposition) return;
                    if (i.disposition === 'enemy' && token.disposition === target?.disposition) return;
                }
                triggers.push({
                    entity: effect,
                    castData: {
                        castLevel: effectUtils.getCastLevel(effect) ?? -1,
                        baseLevel: effectUtils.getBaseLevel(effect) ?? -1,
                        saveDC: effectUtils.getSaveDC(effect) ?? -1
                    },
                    macro: i.macro,
                    name: effect.name,
                    priority: i.priority,
                    token: token.object,
                    target: target?.object,
                    distance: distance,
                    identifier: i.identifier
                });
            });
        }
    }
    return triggers;
}
function getSortedTriggers(tokens, pass, token) {
    let allTriggers = [];
    tokens.forEach(i => {
        let distance;
        if (token) {
            distance = tokenUtils.getDistance(token.object, i.object, {wallsBlock: true});
            if (distance < 0) return;
        }
        allTriggers.push(...collectTokenMacros(i, pass, distance, token));
    });
    let names = new Set(allTriggers.map(i => i.name));
    let maxMap = {};
    names.forEach(i => {
        let maxLevel = Math.max(...allTriggers.map(i => i.castData.castLevel));
        let maxDC = Math.max(...allTriggers.map(i => i.castData.saveDC));
        maxMap[i] = {
            maxLevel: maxLevel,
            maxDC: maxDC
        };
    });
    let triggers = [];
    names.forEach(i => {
        let maxLevel = maxMap[i].maxLevel;
        let maxDC = maxMap[i].maxDC;
        let maxDCTrigger = allTriggers.find(j => j.castData.saveDC === maxDC);
        let selectedTrigger;
        if (maxDCTrigger.castData.castLevel === maxLevel) {
            selectedTrigger = maxDCTrigger;
        } else {
            selectedTrigger = allTriggers.find(j => j.castData.castLevel === maxLevel);
        }
        triggers.push(selectedTrigger);
    });
    return triggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger, options) {
    genericUtils.log('dev', 'Executing Aura Macro: ' + trigger.macro.name);
    try {
        await trigger.macro({trigger, options});
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
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
        let identifier = effectUtils.getEffectIdentifier(effect);
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
    await Promise.all(removedEffects.map(async effect => {
        let testEffect = await fromUuid(effect.uuid);
        if (testEffect) await genericUtils.remove(testEffect);
    }));
    if (triggers.length) await genericUtils.sleep(50);
    for (let i of triggers) await executeMacro(i, options);
}
async function updateAuras(token, options) {
    let effect = actorUtils.getEffects(token.actor).find(i => i.flags['chris-premades']?.macros?.aura);
    if (effect) {
        await Promise.all(token.parent.tokens.map(async i => await executeMacroPass(token.parent.tokens, 'create', i, options)));
    } else {
        await executeMacroPass(token.parent.tokens, 'create', token, options);
    }
}
async function createToken(token, options, userId) {
    if (!socketUtils.isTheGM()) return;
    await updateAuras(token);
}
async function deleteToken(token, options, userId) {
    if (!socketUtils.isTheGM()) return;
    let effect = actorUtils.getEffects(token.actor).find(i => i.flags['chris-premades']?.macros?.aura);
    if (effect) {
        await Promise.all(token.parent.tokens.filter(j => j != token).map(async i => await executeMacroPass(token.parent.tokens.filter(j => j != token), 'create', i, options)));
    } else {
        await executeMacroPass(token.parent.tokens, 'create', token, options);
    }
}
async function canvasReady(canvas) {
    if (!socketUtils.isTheGM()) return;
    await Promise.all(canvas.scene.tokens.map(async i => await executeMacroPass(canvas.scene.tokens, 'create', i)));
}
async function effectCheck(effect) {
    if (effect.flags['chris-premades']?.macros?.aura) await Promise.all(canvas.scene.tokens.map(async i => await executeMacroPass(canvas.scene.tokens, 'create', i)));
}
export let auras = {
    updateAuras,
    canvasReady,
    createToken,
    deleteToken,
    effectCheck
};