import {custom} from './custom.js';
import {actorUtils, socketUtils, templateUtils, effectUtils, genericUtils, tokenUtils, itemUtils, regionUtils, macroUtils} from '../utils.js';
import {templateEvents} from './template.js';
import {regionEvents} from './region.js';
import {masteries} from '../macros/2024/mechanics/masteries.js';
function getMacroData(entity) {
    return entity.flags['chris-premades']?.macros?.combat ?? [];
}
function collectMacros(entity) {
    let macroList = [];
    macroList.push(...getMacroData(entity));
    if (!macroList.length) return [];
    return macroList.map(i => custom.getMacro(i, genericUtils.getRules(entity))).filter(j => j);
}
function getRegionOrigin(region) {
    let originUuid = region.flags['chris-premades']?.region?.origin;
    if (!originUuid) return;
    return fromUuidSync(originUuid, {strict: false});
}
function collectTokenMacros(token, pass, distance, target) {
    let triggers = [];
    function checkValid(macro, token, target, distance) {
        if (distance && macro.distance < distance) return;
        if (macro.disposition) {
            if (macro.disposition === 'ally' && token.disposition != target?.disposition) return;
            if (macro.disposition === 'enemy' && token.disposition === target?.disposition) return;
        }
        return true;
    }
    if (token.actor) {
        let effects;
        if (pass === 'turnStartSource' || pass === 'turnEndSource') {
            let check = pass === 'turnEndSource' ? 'previous' : 'current';
            effects = actorUtils.getEffects(token.actor, {includeItemEffects: true}).filter(effect => {
                let originItem = effectUtils.getOriginItemSync(effect);
                if (!originItem?.actor) return;
                let firstToken = actorUtils.getFirstToken(originItem.actor);
                if (!firstToken?.combatant) return;
                if (!firstToken.combatant.combat[check]) return;
                if (firstToken.combatant.combat[check].tokenId != firstToken.document.id) return;
                return true;
            });
        } else {
            effects = actorUtils.getEffects(token.actor, {includeItemEffects: true});
        }
        effects.forEach(effect => {
            let macroList = collectMacros(effect).filter(i => i.combat?.find(j => j.pass === pass)).flatMap(k => k.combat).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(effect, 'combat', {pass}));
            if (!macroList.length) return;
            let validEffectMacros = [];
            macroList.forEach(i => {
                if (!checkValid(i, token, target, distance)) return;
                validEffectMacros.push({
                    macro: i.macro,
                    priority: i.priority
                });
            });
            if (validEffectMacros.length) {
                triggers.push({
                    entity: effect,
                    castData: {
                        castLevel: effectUtils.getCastLevel(effect) ?? -1,
                        baseLevel: effectUtils.getBaseLevel(effect) ?? -1,
                        saveDC: effectUtils.getSaveDC(effect) ?? -1
                    },
                    macros: validEffectMacros,
                    name: effect.name.slugify(),
                    token: token.object,
                    target: target?.object,
                    distance: distance,
                });
            }
        });
        if (pass != 'turnStartSource' && pass != 'turnEndSource') {
            token.actor.items.forEach(item => {
                let macroList = collectMacros(item).filter(i => i.combat?.find(j => j.pass === pass)).flatMap(k => k.combat).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(item, 'combat', {pass}));
                if (!macroList.length) return;
                let validItemMacros = [];
                macroList.forEach(i => {
                    if (!checkValid(i, token, target, distance)) return;
                    validItemMacros.push({
                        macro: i.macro,
                        priority: i.priority
                    });
                });
                if (validItemMacros.length) {
                    triggers.push({
                        entity: item,
                        castData: {
                            castLevel: -1,
                            saveDC: itemUtils.getSaveDC(item)
                        },
                        macros: validItemMacros,
                        name: item.name,
                        token: token.object,
                        target: target?.object,
                        distance: distance
                    });
                }
            });
        }
    }
    let templates;
    if (pass === 'turnStartSource' || pass === 'turnEndSource') {
        let check = pass === 'turnEndSource' ? 'previous' : 'current';
        templates = token.parent.templates.filter(template => {
            if (!template.flags.dnd5e?.origin) return;
            let originItem = fromUuidSync(template.flags.dnd5e.item);
            if (!originItem) return;
            let firstToken = actorUtils.getFirstToken(originItem.actor);
            if (!firstToken?.combatant) return;
            if (!firstToken.combatant.combat[check]) return;
            if (firstToken.combatant.combat[check].tokenId != firstToken.document.id) return;
            return true;
        });
    } else {
        templates = templateUtils.getTemplatesInToken(token.object);
    }
    templates.forEach(template => {
        let macroList = templateEvents.collectMacros(template).filter(i => i.template?.find(j => j.pass === pass)).flatMap(k => k.template).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(template, 'template', {pass}));
        if (!macroList.length) return;
        triggers.push({
            entity: template,
            castData: {
                castLevel: templateUtils.getCastLevel(template) ?? -1,
                saveDC: templateUtils.getSaveDC(template) ?? -1
            },
            macros: macroList,
            name: templateUtils.getName(template).slugify(),
            token: token.object,
            target: target?.object,
            distance: distance
        });
    });
    let regions;
    if (pass === 'turnStartSource' || pass === 'turnEndSource') {
        let check = pass === 'turnEndSource' ? 'previous' : 'current';
        regions = token.parent.regions.filter(region => {
            let origin = getRegionOrigin(region);
            if (!origin?.actor) return;
            let firstToken = actorUtils.getFirstToken(origin.actor);
            if (!firstToken?.combatant) return;
            if (!firstToken.combatant.combat[check]) return;
            if (firstToken.combatant.combat[check].tokenId != firstToken.document.id) return;
            return true;
        });
    } else {
        regions =  token.regions;
    }
    regions.forEach(region => {
        let macroList = regionEvents.collectMacros(region).filter(i => i.region?.find(j => j.pass === pass)).flatMap(k => k.region).filter(l => l.pass === pass).concat(macroUtils.getEmbeddedMacros(region, 'region', {pass}));
        if (!macroList.length) return;
        triggers.push({
            entity: region,
            castData: {
                castLevel: regionUtils.getCastLevel(region),
                saveDC: regionUtils.getSaveDC(region)
            },
            macros: macroList,
            name: region.name,
            token: token.object,
            target: target?.object,
            distance: distance
        });
    });
    return triggers;
}
function getSortedTriggers(tokens, pass, token, details) {
    let allTriggers = [];
    tokens.forEach(i => {
        let distance;
        if (token) {
            distance = tokenUtils.getDistance(token.object, i.object, {wallsBlock: true, checkCover: genericUtils.getCPRSetting('movementPerformance') === 3});
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
                distance: trigger.distance,
                target: trigger.target,
                currentTurn: details?.currentTurn,
                previousTurn: details?.previousTurn,
                previousRound: details?.previousRound,
                currentRound: details?.currentRound,
                macroName: typeof macro.macro === 'string' ? 'Embedded' : macro.macro.name
            });
        });
    });
    return sortedTriggers.sort((a, b) => a.priority - b.priority);
}
async function executeMacro(trigger) {
    try {
        if (typeof trigger.macro === 'string') {
            genericUtils.log('dev', 'Executing Embedded Combat Macro: ' + trigger.macroName + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
            await custom.executeScript({script: trigger.macro, trigger});
        } else {
            genericUtils.log('dev', 'Executing Combat Macro: ' + trigger.macroName + ' from ' + trigger.name + ' with a priority of ' + trigger.priority);
            await trigger.macro({trigger});
        }
    } catch (error) {
        console.error(error);
    }
}
async function executeMacroPass(tokens, pass, token, details) {
    genericUtils.log('dev', 'Executing Combat Macro Pass: ' + pass + ' for ' + (token?.name ?? tokens[0].name));
    let triggers = getSortedTriggers(tokens, pass, token, details);
    if (triggers.length) await genericUtils.sleep(50);
    for (let i of triggers) await executeMacro(i);
}
async function updateCombat(combat, changes, context) {
    if (!socketUtils.isTheGM()) return;
    let currentTurn = combat.current.turn;
    let previousTurn = combat.previous.turn ?? -1;
    let currentRound = combat.current.round;
    let previousRound = combat.previous.round ?? -1;
    if (!changes.turn && !changes.round) return;
    if (!combat.started || !combat.isActive) return;
    if (currentRound < previousRound || (currentTurn < previousTurn && currentTurn === previousRound)) return;
    let currentCombatant = combat.combatants.get(combat.current.combatantId);
    let previousCombatant = combat.combatants.get(combat.previous.combatantId);
    let currentScene = game.scenes.get(currentCombatant?.sceneId);
    let previousScene = game.scenes.get(previousCombatant?.sceneId);
    let currentToken = currentScene?.tokens.get(currentCombatant.tokenId);
    let previousToken = previousScene?.tokens.get(previousCombatant.tokenId);
    let details = {
        currentTurn,
        previousTurn,
        currentRound,
        previousRound
    };
    let allTokens = combat.combatants.map(i => game.scenes.get(i.sceneId)?.tokens.get(i.tokenId)).filter(i => i);
    if (previousToken) {
        await executeMacroPass([previousToken], 'turnEnd', undefined, details);
        await executeMacroPass(previousScene?.tokens ?? [], 'turnEndSource', previousToken, details);
    }
    if (currentToken) {
        await executeMacroPass([currentToken], 'turnStart', undefined, details);
        await executeMacroPass(currentScene?.tokens ?? [], 'turnStartSource', currentToken, details);
    }
    for (let token of allTokens) await executeMacroPass([token], 'everyTurn', undefined, details);
    if (previousToken) await executeMacroPass(previousScene?.tokens.filter(i => i != previousToken) ?? [], 'turnEndNear', previousToken, details);
    if (currentToken) await executeMacroPass(currentScene?.tokens.filter(i => i != currentToken) ?? [], 'turnStartNear', currentToken, details);
}
async function combatStartEnd(combat, isEnd) {
    if (!socketUtils.isTheGM()) return;
    let pass = isEnd ? 'combatEnd' : 'combatStart';
    let scenes = new Set();
    for (let combatant of combat.combatants) {
        let scene = game.scenes.get(combatant.sceneId);
        if (scene) scenes.add(scene);
        let token = scene?.tokens.get(combatant.tokenId);
        if (token) await executeMacroPass([token], pass);
    }
    scenes = Array.from(scenes);
    let sceneTemplates = scenes.map(i => Array.from(i.templates)).flat();
    let sceneRegions = scenes.map(i => Array.from(i.regions)).flat();
    await templateEvents.executeMacroPass(sceneTemplates ?? [], pass);
    await regionEvents.executeMacroPass(sceneRegions ?? [], pass);
    if (!isEnd) return;
    if (genericUtils.getCPRSetting('weaponMastery')) await masteries.combatEnd(combat);
}
async function combatStart(combat, changes) {
    await combatStartEnd(combat, false);

}
async function deleteCombat(combat, changes, context) {
    await combatStartEnd(combat, true);
}
export let combatEvents = {
    combatStart,
    deleteCombat,
    updateCombat,
    executeMacroPass,
    collectMacros
};