import {chris} from './helperFunctions.js';
import {macros} from './macros.js';
import {socket} from './module.js';
let triggers = {};
let effectTriggers = {};
export async function loadTriggers() {
    triggers = game.settings.get('chris-premades', 'Movement Triggers');
    effectTriggers = game.settings.get('chris-premades', 'Movement Effect Triggers');
    if (game.user.isGM) {
        for (let name of Object.values(triggers)) {
            for (let spell of name) {
                let effect = await fromUuid(spell.effectUuid)
                if (!effect) {
                    console.log('Chris | Removing stale movement trigger for ' + spell.macro);
                    await removeTrigger(spell.macro, spell.sourceTokenID);
                }
            }
        }
        for (let name of Object.values(effectTriggers)) {
            for (let spell of name) {
                let effect = await fromUuid(spell.effectUuid)
                if (!effect) {
                    console.log('Chris | Removing stale effect aura for ' + spell.macro);
                    await removeEffectAura(spell.macro, spell.sourceActorUuid);
                }
            }
        }
    }
}
export async function updateMoveTriggers(updatedTriggers) {
    triggers = updatedTriggers;
}
export async function updateGMTriggers(updatedTriggers) {
    await game.settings.set('chris-premades', 'Movement Triggers', updatedTriggers);
}
async function effectMove(token, changes, ignoredUuid) {
    let distaceMap = {};
    for (let name of Object.values(effectTriggers)) {
        let validSources = [];
        for (let spell of name) {
            if (spell.effectUuid === ignoredUuid) continue;
            let sourceActor = await fromUuid(spell.sourceActorUuid);
            if (!sourceActor) continue;
            let sourceTokens = sourceActor.getActiveTokens();
            if (sourceTokens.length === 0) continue;
            let sourceToken = sourceTokens[0];
            if (spell.conscious) {
                let sourceHP = sourceToken.actor.system.attributes.hp.value;
                if (sourceHP === 0) continue;
            }
            switch (spell.targetDisposition) {
                case 'ally':
                    if (token.disposition != sourceToken.document.disposition) continue;
                    break;
                case 'enemy':
                    if (token.disposition === sourceToken.document.disposition) continue;
                    break;
            }
            let distance = distaceMap[sourceToken.id];
            if (!distance) {
                distance = chris.getDistance(token, sourceToken);
                distaceMap[sourceToken.id] = distance;
            }
            if (distance > spell.range) continue;
            validSources.push(spell);
        }
        let maxLevel = Math.max(...validSources.map(spell => spell.castLevel));
        let selectedSpell = validSources.find(spell => spell.castLevel === maxLevel);
        if (selectedSpell) macros.onMoveEffect(selectedSpell.macro, token, selectedSpell.castLevel, selectedSpell.spellDC, selectedSpell.effectData);
        if (!selectedSpell) {
            let effect = chris.findEffect(token.actor, name[0].effectData.label);
            if (effect) chris.removeEffect(effect);
        }
        await warpgate.wait(100);
    }
}
async function refreshEffects(ignoredUuid) {
    for (let token of game.canvas.scene.tokens.contents) {
        effectMove(token, null, ignoredUuid);
    }
}
export function tokenMoved(token, changes) {
    if (game.settings.get('chris-premades', 'LastGM') != game.user.id) return;
    if (!changes.x && !changes.y && !changes.elevation) return;
    for (let name of Object.values(triggers)) {
        let validSources = [];
        for (let spell of name) {
            let sourceToken = canvas.tokens.get(spell.sourceTokenID);
            if (!sourceToken) continue;
            if (spell.ignoreSelf && sourceToken.id == token.id) continue;
            if (spell.nonAllies && (token.disposition === sourceToken.document.disposition || token.disposition === 0)) continue;
            let distance = chris.getDistance(token, sourceToken);
            if (distance > spell.range) continue;
            validSources.push(spell);
        }
        let maxLevel = Math.max(...validSources.map(spell => spell.castLevel));
        let selectedSpell = validSources.find(spell => spell.castLevel === maxLevel);
        if (selectedSpell) macros.onMove(selectedSpell.macro, token, selectedSpell.castLevel, selectedSpell.spellDC, selectedSpell.damage, selectedSpell.damageType, selectedSpell.sourceTokenID);
    }
    if (token.actor.flags['chris-premades']?.aura) {
        refreshEffects(null);
    } else {
        effectMove(token, changes, null);
    }
}
export function combatUpdate(combat, changes, context) {
    if (game.settings.get('chris-premades', 'LastGM') != game.user.id) return;
    let currentTurn = combat.current.turn;
    let previousTurn = context.effectmacro?.previousTR?.T;
    let currentRound = combat.current.round;
    let previousRound = context.effectmacro?.previousTR?.R;
    if (!changes.turn && !changes.round) return;
    if (!combat.started || !combat.isActive) return;
    if (currentRound < previousRound || (currentTurn < previousTurn && currentTurn === previousRound)) return;
    let token = game.combat.scene.tokens.get(combat.current.tokenId);
    if (!token) return;
    for (let name of Object.values(triggers)) {
        let validSources = [];
        for (let spell of name) {
            if (spell.turn != 'start') continue;
            let sourceToken = game.combat.scene.tokens.get(spell.sourceTokenID);
            if (!sourceToken) continue;
            if (spell.ignoreSelf && sourceToken.id == token.id) continue;
            if (spell.nonAllies && (token.disposition === sourceToken.disposition || token.disposition === 0)) continue;
            let distance = chris.getDistance(token, sourceToken);
            if (distance > spell.range) continue;
            validSources.push(spell);
        }
        let maxLevel = Math.max(...validSources.map(spell => spell.castLevel));
        let selectedSpell = validSources.find(spell => spell.castLevel === maxLevel);
        if (!selectedSpell) return;
        macros.onMove(selectedSpell.macro, token, selectedSpell.castLevel, selectedSpell.spellDC, selectedSpell.damage, selectedSpell.damageType, selectedSpell.sourceTokenID);
    }
}
async function addTrigger(name, castLevel, spellDC, damage, damageType, sourceTokenID, range, ignoreSelf, nonAllies, turn, effectUuid) {
    let spell = {
        'castLevel': castLevel,
        'spellDC': spellDC,
        'damage': damage,
        'damageType': damageType,
        'sourceTokenID': sourceTokenID,
        'range': range,
        'ignoreSelf': ignoreSelf,
        'nonAllies': nonAllies,
        'turn': turn,
        'macro': name,
        'effectUuid': effectUuid
    }
    if (!triggers[name]) triggers[name] = [];
    triggers[name].push(spell);
    await socket.executeForEveryone('updateMoveTriggers', triggers);
    await socket.executeAsGM('updateGMTriggers', triggers);
}
async function removeTrigger(name, sourceActorUuid) {
    if (!triggers[name]) return;
    triggers[name] = triggers[name].filter(spell => spell.sourceActorUuid != sourceActorUuid);
    if (triggers[name].length === 0) delete(triggers[name]);
    await socket.executeForEveryone('updateMoveTriggers', triggers);
    await socket.executeAsGM('updateGMTriggers', triggers);
}
function status() {
    return triggers;
}
async function purge() {
    await socket.executeForEveryone('updateMoveTriggers', {});
    await socket.executeAsGM('updateGMTriggers', {});
}
async function addEffectAura(name, castLevel, spellDC, sourceActorUuid, range, targetDisposition, conscious, effectData, effectUuid) {
    let spell = {
        'macro': name,
        'castLevel': castLevel,
        'spellDC': spellDC,
        'sourceActorUuid': sourceActorUuid,
        'range': range,
        'targetDisposition': targetDisposition,
        'conscious': conscious,
        'effectData': effectData,
        'effectUuid': effectUuid
    }
    if (!effectTriggers[name]) effectTriggers[name] = [];
    effectTriggers[name].push(spell);
    await socket.executeForEveryone('updateEffectTriggers', effectTriggers);
    await socket.executeAsGM('updateGMEffectTriggers', effectTriggers);
}
async function removeEffectAura(name, sourceActorUuid) {
    if (!effectTriggers[name]) return;
    effectTriggers[name] = effectTriggers[name].filter(spell => spell.sourceActorUuid != sourceActorUuid);
    if (effectTriggers[name].length === 0) delete(effectTriggers[name]);
    await socket.executeForEveryone('updateEffectTriggers', effectTriggers);
    await socket.executeAsGM('updateGMEffectTriggers', effectTriggers);
}
function effectStatus() {
    return effectTriggers;
}
async function effectPurge() {
    await socket.executeForEveryone('updateEffectTriggers', {});
    await socket.executeAsGM('updateGMEffectTriggers', {});
}
export async function updateEffectTriggers(updatedTriggers) {
    effectTriggers = updatedTriggers;
}
export async function updateGMEffectTriggers(updatedTriggers) {
    await game.settings.set('chris-premades', 'Movement Effect Triggers', updatedTriggers);
}
export function preActorUpdate(actor, updates, options) {
    if (game.settings.get('chris-premades', 'LastGM') != game.user.id) return;
    if (!actor.flags['chris-premades']?.aura) return;
    if (!updates.system?.attributes?.hp) return;
    let oldHP = actor.system.attributes.hp.value;
    let newHP = updates.system.attributes.hp.value;
    if (oldHP > 0 && newHP === 0) foundry.utils.setProperty(options, 'chris-premades.refreshEffects', true);
    if (newHP > 0 && oldHP === 0) foundry.utils.setProperty(options, 'chris-premades.refreshEffects', true);
}
export function actorUpdate(actor, updates, options) {
    if (options['chris-premades']?.refreshEffects) refreshEffects(null);
}
export function tokenPlaced(token) {
    if (token.actor.flags['chris-premades']?.aura) refreshEffects(null);
}
export function sceneReady(){
    
}
export let effectAura = {
    'add': addEffectAura,
    'remove': removeEffectAura,
    'status': effectStatus,
    'purge': effectPurge,
    'refresh': refreshEffects
}
export let tokenMove = {
    'add': addTrigger,
    'remove': removeTrigger,
    'status': status,
    'purge': purge
}