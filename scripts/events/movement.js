import * as macros from '../macros.js';
import {actorUtils, effectUtils, genericUtils, socketUtils, tokenUtils} from '../utils.js';
function getMovementMacroData(entity) {
    return entity.flags['chris-premades']?.macros?.movement ?? [];
}
function collectMovementMacros(entity) {
    let macroList = [];
    macroList.push(...getMovementMacroData(entity));
    if (!macroList.length) return [];
    return macroList.map(i => macros[i]).filter(j => j);
}
function collectTokenMacros(token, pass, distance) {
    let triggers = [];
    if (token.actor) {
        let effects = actorUtils.getEffects(token.actor);
        for (let effect of effects) {
            let macroList = collectMovementMacros(effect);
            if (!macroList.length) continue;
            let movementMacros = macroList.filter(i => i.movement?.find(j => j.pass === pass)).map(k => k.movement).flat().filter(l => l.pass === pass);
            movementMacros.forEach(i => {
                if (distance && i.distance < distance) return;
                triggers.push({
                    entity: effect,
                    castData: {
                        castLevel: effectUtils.getCastLevel(effect) ?? -1,
                        baseLevel: effectUtils.getBaseLevel(effect) ?? -1,
                        saveDC: effectUtils.getSaveDC(effect) ?? -1
                    },
                    macro: i.macro,
                    name: effect.name
                });
            });
        }
        for (let item of token.actor.items) {
            let macroList = collectMovementMacros(item);
            if (!macroList.length) continue;
            let itemMacros = macroList.filter(i => i.movement?.find(j => j.pass === pass)).map(k => k.movement).flat().filter(l => l.pass === pass);
            itemMacros.forEach(i => {
                triggers.push({
                    entity: item,
                    castData: {
                        castLevel: -1,
                        saveDC: -1
                    },
                    macro: i.macro,
                    name: item.name
                });
            });
        }
    }
    return triggers;
}
function getSortedTriggers(token, pass, distance) {
    let allTriggers = collectTokenMacros(token, pass, distance);
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
    return triggers;
}
async function executeMacro(trigger) {
    console.log('CPR: Executing Movement Macro: ' + trigger.macro.name);
    try {
        await trigger.macro(trigger);
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
        console.error(error);
    }
}
async function executeMacroPass(token, pass, distance) {
    console.log('CPR: Executing Movement Macro Pass: ' + pass + ' for ' + token.name);
    let triggers = getSortedTriggers(token, pass, distance).sort((a, b) => a.priority - b.priority);
    if (triggers.length) await genericUtils.sleep(50);
    for (let i of triggers) await executeMacro(i);
}
async function updateToken(token, updates, options, userId) {
    if (!socketUtils.isTheGM()) return;
    if (token.parent.id != canvas.scene.id) return;
    if (!updates.x && !updates.y && !updates.elevation) return;
    // eslint-disable-next-line no-undef
    await CanvasAnimation.getAnimation(token.object.animationName)?.promise;
    await executeMacroPass(token, 'moved');
    for (let i of token.parent.tokens) {
        if (i === token) continue;
        let distance = tokenUtils.getDistance(token.object, i.object);
        await executeMacroPass(i, 'movedNear', distance);
    }
}
export let movementEvents = {
    updateToken
};