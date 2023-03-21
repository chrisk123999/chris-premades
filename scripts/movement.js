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
                    await removeEffectAura(spell.macro, spell.sourceTokenID);
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
export function tokenMoved(token, changes) {
    if (game.settings.get('chris-premades', 'LastGM') != game.user.id) return;
    if (!changes.x && !changes.y) return;
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
    for (let name of Object.values(effectTriggers)) {
        let validSources = [];
        for (let spell of name) {
            let sourceToken = canvas.tokens.get(spell.sourceTokenID);
            if (!sourceToken) continue;
            switch (spell.targetDisposition) {
                case 'ally':
                    if (token.disposition != sourceToken.disposition) continue;
                    break;
                case 'enemy':
                    if (token.disposition === sourceToken.disposition) continue;
                    break;
            }
            let distance = chris.getDistance(token, sourceToken);
            if (distance > spell.range) continue;
            validSources.push(spell);
        }
        let maxLevel = Math.max(...validSources.map(spell => spell.castLevel));
        let selectedSpell = validSources.find(spell => spell.castLevel === maxLevel);
        if (selectedSpell) macros.onMoveEffect(selectedSpell.macro, token, selectedSpell.castLevel, selectedSpell.spellDC, selectedSpell.effectData, selectedSpell.sourceTokenID);
        // delete effect here
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
async function removeTrigger(name, sourceTokenID) {
    if (!triggers[name]) return;
    triggers[name] = triggers[name].filter(spell => spell.sourceTokenID != sourceTokenID);
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
async function addEffectAura(name, castLevel, spellDC, sourceTokenID, range, targetDisposition, effectData, effectUuid) {
    let spell = {
        'macro': name,
        'castLevel': castLevel,
        'spellDC': spellDC,
        'sourceTokenID': sourceTokenID,
        'range': range,
        'targetDisposition': targetDisposition,
        'effectData': effectData,
        'effectUuid': effectUuid
    }
    if (!effectTriggers[name]) effectTriggers[name] = [];
    effectTriggers[name].push(spell);
    await socket.executeForEveryone('updateEffectTriggers', effectTriggers);
    await socket.executeAsGM('updateGMEffectTriggers', effectTriggers);
}
async function removeEffectAura(name, sourceTokenID) {
    if (!effectTriggers[name]) return;
    effectTriggers[name] = effectTriggers[name].filter(spell => spell.sourceTokenID != sourceTokenID);
    if (effectTriggers[name].length === 0) delete(effectTriggers[name]);
    await socket.executeForEveryone('updateMoveTriggers', effectTriggers);
    await socket.executeAsGM('updateGMTriggers', effectTriggers);
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
export let effectAura = {
    'add': addEffectAura,
    'remove': removeEffectAura,
    'status': effectStatus,
    'purge': effectPurge
}
export let tokenMove = {
    'add': addTrigger,
    'remove': removeTrigger,
    'status': status,
    'purge': purge
}