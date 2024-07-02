import * as macros from '../macros.js';
import {actorUtils, effectUtils, genericUtils, itemUtils, socketUtils, templateUtils, tokenUtils} from '../utils.js';
import {templateEvents} from './template.js';
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
                    name: effect.name,
                    priority: i.priority
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
                        castLevel: i.system.level ?? -1,
                        baseLevel: i.system.level ?? -1,
                        saveDC: itemUtils.getSaveDC(i) ?? -1
                    },
                    macro: i.macro,
                    name: item.name,
                    priority: i.priority
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
        allTriggers.push(...collectTokenMacros(i, pass, distance));
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
async function executeMacro(trigger) {
    console.log('CPR: Executing Movement Macro: ' + trigger.macro.name);
    try {
        await trigger.macro(trigger);
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
        console.error(error);
    }
}
async function executeMacroPass(tokens, pass, token) {
    console.log('CPR: Executing Movement Macro Pass: ' + pass);
    let triggers = getSortedTriggers(tokens, pass, token);
    if (triggers.length) await genericUtils.sleep(50);
    for (let i of triggers) await executeMacro(i);
}
function preUpdateToken(token, updates, options, userId) {
    if (!socketUtils.isTheGM()) return;
    let templatesUuids = Array.from(templateUtils.getTemplatesInToken(token.object)).map(i => i.uuid);
    genericUtils.setProperty(options, 'chris-premades.templates.wasIn', templatesUuids);
    genericUtils.setProperty(options, 'chris-premades.coords.previous', {x: token.x, y: token.y});
}
async function updateToken(token, updates, options, userId) {
    if (!socketUtils.isTheGM()) return;
    if (token.parent.id != canvas.scene.id) return;
    if (!updates.x && !updates.y && !updates.elevation) return;
    // eslint-disable-next-line no-undef
    await CanvasAnimation.getAnimation(token.object.animationName)?.promise;
    await executeMacroPass([token], 'moved');
    await executeMacroPass(token.parent.tokens.filter(i => i != token), 'movedNear', token);
    if (!updates.x && !updates.y && updates.elevation) return;
    let coords = {x: token.x, y: token.y};
    let previousCoords = options['chris-premades'].coords.previous;
    let current = Array.from(templateUtils.getTemplatesInToken(token.object));
    let previous = options['chris-premades'].templates.wasIn.map(i => fromUuidSync(i)).filter(j => j);
    let leaving = previous.filter(i => !current.includes(i));
    let entering = current.filter(i => !previous.includes(i));
    let staying = previous.filter(i => current.includes(i));
    let through = token.parent.templates.reduce((acc, template) => {
        let cells = templateUtils.findGrids(previousCoords, coords, template);
        if (!cells.size) return acc;
        acc.push(template);
        return acc;
    }, []);
    let enteredAndLeft = through.filter(i => {
        return !leaving.includes(i.template) && !entering.includes(i.template) && !staying.includes(i.template);
    });
    await templateEvents.executeMacroPass(leaving, 'left', token.object);
    await templateEvents.executeMacroPass(entering, 'enter', token.object);
    await templateEvents.executeMacroPass(staying, 'stay', token.object);
    await templateEvents.executeMacroPass(enteredAndLeft, 'passedThrough', token.object);
    let attachedTemplateUuids = token.flags['chris-premades']?.attached?.attachedTemplateUuids ?? [];
    let removedTemplateUuids = [];
    await Promise.all(attachedTemplateUuids.map(async templateUuid => {
        let template = await fromUuid(templateUuid);
        if (!template) removedTemplateUuids.push(templateUuid);
        await genericUtils.update(template, {
            x: template.x + (coords.x - previousCoords.x),
            y: template.y + (coords.y - previousCoords.y)
        });
    }));
}
export let movementEvents = {
    updateToken,
    preUpdateToken
};