import {attach} from '../extensions/attach.js';
import {custom} from './custom.js';
import {actorUtils, effectUtils, genericUtils, itemUtils, macroUtils, regionUtils, socketUtils, templateUtils, tokenUtils} from '../utils.js';
import {auras} from './auras.js';
import {templateEvents} from './template.js';
import {regionEvents} from './region.js';
import {template as templateExtension} from './../extensions/template.js';
let lagWarningSeen = null;
function getMovementMacroData(entity) {
    return entity.flags['chris-premades']?.macros?.movement ?? [];
}
function collectMovementMacros(entity) {
    let macroList = [];
    macroList.push(...getMovementMacroData(entity));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i, genericUtils.getRules(entity))).filter(j => j);
}
function collectTokenMacros(token, pass, distance, target) {
    let triggers = [];
    if (token.actor) {
        let effects = actorUtils.getEffects(token.actor, {includeItemEffects: true});
        effects.forEach(effect => {
            let macroList = collectMovementMacros(effect).filter(i => i.movement?.find(j => j.pass === pass)).flatMap(k => k.movement).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(effect, 'movement', {pass}));
            if (!macroList.length) return;
            let validMovementMacros = [];
            macroList.forEach(i => {
                if (distance && i.distance < distance) return;
                if (i.disposition) {
                    if (i.disposition === 'ally' && token.disposition != target?.disposition) return;
                    if (i.disposition === 'enemy' && token.disposition === target?.disposition) return;
                }
                validMovementMacros.push({
                    macro: i.macro,
                    priority: i.priority
                });
            });
            if (!validMovementMacros.length) return;
            triggers.push({
                entity: effect,
                castData: {
                    castLevel: effectUtils.getCastLevel(effect) ?? -1,
                    baseLevel: effectUtils.getBaseLevel(effect) ?? -1,
                    saveDC: effectUtils.getSaveDC(effect) ?? -1
                },
                macros: validMovementMacros,
                name: effect.name.slugify(),
                token: token.object,
                target: target?.object,
                distance: distance
            });
        });
        token.actor.items.forEach(item => {
            let macroList = collectMovementMacros(item).filter(i => i.movement?.find(j => j.pass === pass)).flatMap(k => k.movement).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(item, 'movement', {pass}));
            if (!macroList.length) return;
            let validMovementMacros = [];
            macroList.forEach(i => {
                if (distance && i.distance < distance) return;
                if (i.disposition) {
                    if (i.disposition === 'ally' && token.disposition != target?.disposition) return;
                    if (i.disposition === 'enemy' && token.disposition === target?.disposition) return;
                }
                validMovementMacros.push({
                    macro: i.macro,
                    priority: i.priority
                });
            });
            if (validMovementMacros.length) {
                triggers.push({
                    entity: item,
                    castData: {
                        castLevel: item.system.level ?? -1,
                        baseLevel: item.system.level ?? -1,
                        saveDC: itemUtils.getSaveDC(item) ?? -1
                    },
                    macros: validMovementMacros,
                    name: item.name.slugify(),
                    token: token.object,
                    target: target?.object,
                    distance: distance
                });
            }
        });
    }
    return triggers;
}
function getSortedTriggers(tokens, pass, token) {
    let allTriggers = [];
    tokens.forEach(i => {
        let distance;
        let ignoredPasses = ['create', 'deleted', 'sceneCreated', 'sceneDeleted'];
        if (token && !ignoredPasses.includes(pass)) {
            let perfSetting = genericUtils.getCPRSetting('movementPerformance');
            distance = tokenUtils.getDistance(token.object, i.object, {wallsBlock: perfSetting > 0, checkCover: perfSetting === 3});
            if (distance < 0) return;
        }
        allTriggers.push(...collectTokenMacros(i, pass, distance, token));
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
            genericUtils.log('dev', 'Executing Embedded Movement Macro: ' + trigger.macroName);
            await custom.executeScript({script: trigger.macro, trigger, options});
        } else {
            genericUtils.log('dev', 'Executing Movement Macro: ' + trigger.macroName);
            await trigger.macro({trigger, options});
        }
    } catch (error) {
        console.error(error);
    }
}
async function executeMacroPass(tokens, pass, token, options) {
    genericUtils.log('dev', 'Executing Movement Macro Pass: ' + pass);
    let triggers = getSortedTriggers(tokens, pass, token);
    if (triggers.length) await genericUtils.sleep(50);
    for (let i of triggers) await executeMacro(i, options);
    return triggers.length;
}
async function moveToken(token, movement, options, user) {
    if (!socketUtils.isTheGM()) return;
    if (lagWarningSeen === null) lagWarningSeen = genericUtils.getCPRSetting('movementPerformanceDisable');
    if (!token.actor) return;
    if (token.actor.type === 'group') return;
    if (token.parent.id != canvas.scene.id) return;
    let isFinalMovement = !movement.pending.waypoints.length;
    let previousCoords = genericUtils.duplicate(movement.origin);
    let coords = genericUtils.duplicate(movement.destination);
    if (!previousCoords) return;
    let xDiff = token.width * canvas.grid.size / 2;
    let yDiff = token.height * canvas.grid.size / 2;
    coords.x += xDiff;
    coords.y += yDiff;
    previousCoords.x += xDiff;
    previousCoords.y += yDiff;
    let ignore = genericUtils.getProperty(options, 'chris-premades.movement.ignore');
    let skipMove = genericUtils.getCPRSetting('movementPerformance') < 2 && !isFinalMovement;
    let previousTemplates = Array.from(templateUtils.getTemplatesInToken(token.object));
    let previousRegions = token.parent.regions.filter(region => token.testInsideRegion(region, movement.origin));
    // eslint-disable-next-line no-undef
    await token.object.movementAnimationPromise;
    let startTime = performance.now();
    let count = 0;
    if (!ignore) {
        let teleport = CONFIG.Token.movement.actions[movement.passed.waypoints.at(-1).action]?.teleport;
        genericUtils.setProperty(options, 'chris-premades.movement.teleport', teleport);
        // TODO: move this into the skipMove check? Was there a reason we put this here?
        if (isFinalMovement) await auras.updateAuras(token, options);
        if (!skipMove) {
            count += await executeMacroPass([token], 'moved', undefined, options);
            count += await executeMacroPass(token.parent.tokens.filter(i => i != token), 'movedNear', token, options);
            count += await executeMacroPass(token.parent.tokens.filter(i => i), 'movedScene', token, options);
        }
        let moveRay = new foundry.canvas.geometry.Ray(previousCoords, coords);
        let currentTemplates = Array.from(templateUtils.getTemplatesInToken(token.object));
        let leavingTemplates = previousTemplates.filter(i => !currentTemplates.includes(i));
        let enteringTemplates = currentTemplates.filter(i => !previousTemplates.includes(i));
        let stayingTemplates = previousTemplates.filter(i => currentTemplates.includes(i));
        let throughTemplates = token.parent.templates.reduce((acc, template) => {
            let intersected = templateUtils.rayIntersectsTemplate(template, moveRay);
            if (!intersected) return acc;
            acc.push(template);
            return acc;
        }, []);
        let enteredAndLeftTemplates = [];
        if (!teleport) {
            enteredAndLeftTemplates = throughTemplates.filter(i => {
                return !leavingTemplates.includes(i) && !enteringTemplates.includes(i) && !stayingTemplates.includes(i);
            });
        }
        if (leavingTemplates.length) count += await templateEvents.executeMacroPass(leavingTemplates, 'left', token.object, options);
        for (let template of leavingTemplates) await templateExtension.templateEffectTokenLeave(template, token.object);
        if (enteringTemplates.length) count += await templateEvents.executeMacroPass(enteringTemplates, 'enter', token.object, options);
        for (let template of enteringTemplates) await templateExtension.templateEffectTokenEnter(template, token.object);
        if (stayingTemplates.length) count += await templateEvents.executeMacroPass(stayingTemplates, 'stay', token.object, options);
        if (enteredAndLeftTemplates.length) count += await templateEvents.executeMacroPass(enteredAndLeftTemplates, 'passedThrough', token.object, options);
        let currentRegions = Array.from(token.regions);
        let leavingRegions = previousRegions.filter(i => !currentRegions.includes(i));
        let enteringRegions = currentRegions.filter(i => !previousRegions.includes(i));
        let stayingRegions = previousRegions.filter(i => currentRegions.includes(i));
        let throughRegions = token.parent.regions.reduce((acc, region) => {
            let intersected = regionUtils.rayIntersectsRegion(region, moveRay);
            if (!intersected) return acc;
            acc.push(region);
            return acc;
        }, []);
        let enteredAndLeftRegions = [];
        if (!teleport) {
            enteredAndLeftRegions = throughRegions.filter(i => {
                return !leavingRegions.includes(i) && !enteringRegions.includes(i) && !stayingRegions.includes(i);
            });
        }
        if (leavingRegions.length) count += await regionEvents.executeMacroPass(leavingRegions, 'left', token.object, options);
        if (enteringRegions.length) count += await regionEvents.executeMacroPass(enteringRegions, 'enter', token.object, options);
        if (stayingRegions.length) count += await regionEvents.executeMacroPass(stayingRegions, 'stay', token.object, options);
        if (enteredAndLeftRegions.length) count += await regionEvents.executeMacroPass(enteredAndLeftRegions, 'passedThrough', token.object, options);
    }
    await attach.updateAttachments(token, {x: coords.x - previousCoords.x, y: coords.y - previousCoords.y});
    let endTime = performance.now();
    let diff = endTime - startTime;
    genericUtils.log('dev', 'Movement Event Timing: ' + diff);
    if (!count && !lagWarningSeen && (diff >= 500)) {
        lagWarningSeen = true;
        genericUtils.notify('CHRISPREMADES.Troubleshooter.MovementLag', 'error', {permanent: true});
    }
}
export let movementEvents = {
    moveToken,
    executeMacroPass
};