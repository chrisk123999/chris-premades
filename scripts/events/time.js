import {actorUtils, effectUtils, genericUtils, itemUtils, macroUtils, socketUtils, templateUtils} from '../utils.js';
import {custom} from './custom.js';
function getTimeMacroData(document) {
    return document.flags['chris-premades']?.macros?.time ?? [];
}
function collectTimeMacros(document) {
    let macroList = [];
    macroList.push(...getTimeMacroData(document));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i, genericUtils.getRules(document))).filter(j => j);
}
function collectMacros(actor, pass) {
    let triggers = [];
    let token = actorUtils.getFirstToken(actor);
    actor.items.forEach(item => {
        let macroList = collectTimeMacros(item).filter(i => i.time?.find(j => j.pass === pass)).flatMap(k => k.time).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(item, 'time', {pass}));
        if (!macroList.length) return;
        triggers.push({
            entity: item,
            castData: {
                castLevel: -1,
                baseLevel: -1,
                saveDC: -1
            },
            macros: macroList,
            name: item.name.slugify(),
            token
        });
    });
    actorUtils.getEffects(actor, {includeItemEffects: true}).forEach(effect => {
        let macroList = collectTimeMacros(effect).filter(i => i.time?.find(j => j.pass === pass)).flatMap(k => k.time).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(effect, 'time', {pass}));
        if (!macroList.length) return;
        triggers.push({
            entity: effect,
            castData: {
                castLevel: effectUtils.getCastLevel(effect) ?? -1,
                baseLevel: effectUtils.getBaseLevel(effect) ?? -1,
                saveDC: effectUtils.getSaveDC(effect) ?? -1
            },
            macros: macroList,
            name: effect.name.slugify(),
            token
        });
    });
    return triggers;
}
function getSortedTriggers(actor, pass, options, worldTime, diff) {
    let allTriggers = collectMacros(actor, pass);
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
                name: trigger.name,
                macroName: typeof macro.macro === 'string' ? 'Embedded' : macro.macro.name,
                options,
                token: trigger.token,
                target: actor,
                worldTime,
                diff
            });
        });
    });
    return sortedTriggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger) {
    try {
        if (typeof trigger.macro === 'string') {
            genericUtils.log('dev', 'Executing Embedded Time Macro: ' + trigger.macroName + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
            await custom.executeScript({script: trigger.macro, trigger});
        } else {
            genericUtils.log('dev', 'Executing Time Macro: ' + trigger.macroName + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
            await trigger.macro({trigger});
        }
    } catch (error) {
        console.error(error);
    }
}
async function executeMacroPass(actor, pass, options, worldTime, diff) {
    genericUtils.log('dev', 'Executing Time Macro Pass: ' + pass + ' for ' + actor.name);
    let triggers = getSortedTriggers(actor, pass, options, worldTime, diff);
    if (triggers.length) await genericUtils.sleep(50);
    for (let i of triggers) await executeMacro(i);
}
async function updateWorldTime(worldTime, diff, options, userId) {
    if (!socketUtils.isTheGM()) return;
    let actors = new Set();
    if (canvas.scene) {
        canvas.scene.tokens.forEach(token => {
            if (!token.actor) return;
            actors.add(token.actor);
        });
    }
    game.actors.filter(actor => actor.type === 'character').forEach(actor => {
        actors.add(actor);
    });
    for (let actor of actors) {
        await executeMacroPass(actor, 'timeUpdated', options, worldTime, diff);
    }
}
export let time = {
    updateWorldTime
};