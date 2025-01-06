import {attach} from '../extensions/attach.js';
import {custom} from './custom.js';
import {actorUtils, effectUtils, genericUtils, itemUtils, regionUtils, socketUtils, templateUtils, tokenUtils} from '../utils.js';
import {auras} from './auras.js';
import {templateEvents} from './template.js';
import {regionEvents} from './region.js';
let lagWarningSeen = false;
function getMovementMacroData(entity) {
    return entity.flags['chris-premades']?.macros?.movement ?? [];
}
function collectMovementMacros(entity) {
    let macroList = [];
    macroList.push(...getMovementMacroData(entity));
    if (!macroList.length) return [];
    let rules = entity.documentName === 'Item' ? itemUtils.getRules(entity) : effectUtils.getRules(entity);
    return macroList.map(i => custom.getMacro(i, rules)).filter(j => j);
}
function collectTokenMacros(token, pass, distance, target) {
    let triggers = [];
    if (token.actor) {
        let effects = actorUtils.getEffects(token.actor);
        effects.forEach(effect => {
            let macroList = collectMovementMacros(effect);
            if (!macroList.length) return;
            let movementMacros = macroList.filter(i => i.movement?.find(j => j.pass === pass)).flatMap(k => k.movement).filter(l => l.pass === pass);
            if (!movementMacros.length) return;
            let validMovementMacros = [];
            movementMacros.forEach(i => {
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
            let macroList = collectMovementMacros(item);
            if (!macroList.length) return;
            let itemMacros = macroList.filter(i => i.movement?.find(j => j.pass === pass)).flatMap(k => k.movement).filter(l => l.pass === pass);
            if (!itemMacros.length) return;
            let validMovementMacros = [];
            itemMacros.forEach(i => {
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
        });
    }
    return triggers;
}
function getSortedTriggers(tokens, pass, token) {
    let allTriggers = [];
    tokens.forEach(i => {
        let distance;
        if (token) {
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
                distance: trigger.distance
            });
        });
    });
    return sortedTriggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger, options) {
    genericUtils.log('dev', 'Executing Movement Macro: ' + trigger.macro.name);
    try {
        await trigger.macro({trigger, options});
    } catch (error) {
        //Add some sort of ui notice here. Maybe even some debug info?
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
function preUpdateToken(token, updates, options, userId) {
    //This runs on the local client only!
    let templatesUuids = Array.from(templateUtils.getTemplatesInToken(token.object)).map(i => i.uuid);
    genericUtils.setProperty(options, 'chris-premades.templates.wasIn', templatesUuids);
    genericUtils.setProperty(options, 'chris-premades.coords.previous', {x: token.x, y: token.y, elevation: token.elevation});
    genericUtils.setProperty(options, 'chris-premades.regions.wasIn', Array.from(token.regions.map(i => i.uuid)));
}
async function updateToken(token, updates, options, userId) {
    if (!socketUtils.isTheGM()) return;
    if (!token.actor) return;
    if (token.actor.type === 'group') return;
    if (token.parent.id != canvas.scene.id) return;
    if (!updates.x && !updates.y && !updates.elevation) return;
    let coords = {x: updates.x ?? token.x, y: updates.y ?? token.y};
    let destination = canvas.controls.getRulerForUser(userId)?.destination;
    let tokenBounds = token.object.bounds;
    let isFinalMovement = !destination || (coords.x + tokenBounds.width / 2 === Math.round(destination.x) && coords.y + tokenBounds.height / 2 === Math.round(destination.y));
    let previousCoords = genericUtils.getProperty(options, 'chris-premades.coords.previous');
    if (!previousCoords) return;
    let xDiff = token.width * canvas.grid.size / 2;
    let yDiff = token.height * canvas.grid.size / 2;
    coords.x += xDiff;
    coords.y += yDiff;
    previousCoords.x += xDiff;
    previousCoords.y += yDiff;
    let ignore = genericUtils.getProperty(options, 'chris-premades.movement.ignore');
    let skipMove = genericUtils.getCPRSetting('movementPerformance') < 2 && !isFinalMovement;
    // eslint-disable-next-line no-undef
    await CanvasAnimation.getAnimation(token.object.animationName)?.promise;
    let startTime = performance.now();
    let count = 0;
    if (!ignore) {
        if (isFinalMovement) await auras.updateAuras(token, options);
        if (!skipMove) {
            count += await executeMacroPass([token], 'moved', undefined, options);
            count += await executeMacroPass(token.parent.tokens.filter(i => i != token), 'movedNear', token, options);
            count += await executeMacroPass(token.parent.tokens.filter(i => i), 'movedScene', token, options);
        }
        let moveRay = new Ray(previousCoords, coords);
        if (updates.x || updates.y) {
            let current = Array.from(templateUtils.getTemplatesInToken(token.object));
            let previous = options['chris-premades'].templates.wasIn.map(i => fromUuidSync(i)).filter(j => j);
            let leaving = previous.filter(i => !current.includes(i));
            let entering = current.filter(i => !previous.includes(i));
            let staying = previous.filter(i => current.includes(i));
            let through = token.parent.templates.reduce((acc, template) => {
                let intersected = templateUtils.rayIntersectsTemplate(template, moveRay);
                if (!intersected) return acc;
                acc.push(template);
                return acc;
            }, []);
            let enteredAndLeft = through.filter(i => {
                return !leaving.includes(i) && !entering.includes(i) && !staying.includes(i);
            });
            if (leaving.length) count += await templateEvents.executeMacroPass(leaving, 'left', token.object, options);
            if (entering.length) count += await templateEvents.executeMacroPass(entering, 'enter', token.object, options);
            if (staying.length) count += await templateEvents.executeMacroPass(staying, 'stay', token.object, options);
            if (enteredAndLeft.length) count += await templateEvents.executeMacroPass(enteredAndLeft, 'passedThrough', token.object, options);
        }
        if (updates || updates.y || updates.elevation) {
            let current = Array.from(token.regions);
            let previous = options['chris-premades'].regions.wasIn.map(i => fromUuidSync(i)).filter(j => j);
            let leaving = previous.filter(i => !current.includes(i));
            let entering = current.filter(i => !previous.includes(i));
            let staying = previous.filter(i => current.includes(i));
            let through = token.parent.regions.reduce((acc, region) => {
                let intersected = regionUtils.rayIntersectsRegion(region, moveRay);
                if (!intersected) return acc;
                acc.push(region);
                return acc;
            }, []);
            let enteredAndLeft = through.filter(i => {
                return !leaving.includes(i) && !entering.includes(i) && !staying.includes(i);
            });
            if (leaving.length) count += await regionEvents.executeMacroPass(leaving, 'left', token.object, options);
            if (entering.length) count += await regionEvents.executeMacroPass(entering, 'enter', token.object, options);
            if (staying.length) count += await regionEvents.executeMacroPass(staying, 'stay', token.object, options);
            if (enteredAndLeft.length) count += await regionEvents.executeMacroPass(enteredAndLeft, 'passedThrough', token.object, options);
        }
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
    updateToken,
    preUpdateToken
};