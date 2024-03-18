import {chris} from '../helperFunctions.js';
import {macros} from '../macros.js';
import {socket} from '../module.js';
let triggers = {};
export async function loadTriggers() {
    triggers = game.settings.get('chris-premades', 'Movement Triggers');
    if (game.user.isGM) {
        for (let name of Object.values(triggers)) {
            for (let spell of name) {
                let effect = await fromUuid(spell.effectUuid)
                if (!effect) {
                    console.log('Chris Premades | Removing stale movement trigger for ' + spell.macro);
                    await removeTrigger(spell.macro, spell.sourceTokenID);
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
export async function tokenMovedEarly(token, updates, options, userId) {
    if (token.parent.id != canvas.scene.id) return;
    if (!updates.x && !updates.y && !updates.elevation) return;
    setProperty(options, 'chris-premades.coords.previous.x', token.x);
    setProperty(options, 'chris-premades.coords.previous.y', token.y);
    setProperty(options, 'chris-premades.coords.previous.elevation', token.elevation);
}
export async function tokenMoved(token, changes, options, userId) {
    if (token.parent.id != canvas.scene.id) return;
    if (!chris.isLastGM()) return;
    if (!changes.x && !changes.y && !changes.elevation) return;
    await token.object._animation;
    for (let name of Object.values(triggers)) {
        let validSources = [];
        for (let spell of name) {
            let sourceToken = canvas.tokens.get(spell.sourceTokenID);
            if (!sourceToken) continue;
            if (spell.ignoreSelf && sourceToken.id == token.id) continue;
            if (spell.nonAllies && (token.disposition === sourceToken.document.disposition || token.disposition === 0)) continue;
            let distance = chris.getDistance(token.object, sourceToken, spell.wallsBlock);
            if (distance > spell.range || distance === -1) continue;
            if (spell.offTurnMoveSpecial && chris.inCombat()) {
                if (game.combat.current.tokenId != token.id) {
                    let oldDistance = chris.getCoordDistance(sourceToken, {
                        'width': token.width,
                        'height': token.height,
                        'x': options['chris-premades'].coords.previous.x,
                        'y': options['chris-premades'].coords.previous.y,
                        'elevation': options['chris-premades'].coords.previous.elevation
                    });
                    if (oldDistance <= distance) continue;
                }
            }
            validSources.push(spell);
        }
        let maxLevel = Math.max(...validSources.map(spell => spell.castLevel));
        let selectedSpell = validSources.find(spell => spell.castLevel === maxLevel);
        if (selectedSpell) macros.onMove(selectedSpell.macro, token, selectedSpell.castLevel, selectedSpell.spellDC, selectedSpell.damage, selectedSpell.damageType, selectedSpell.sourceTokenID, 'move');
    }
}
export function combatUpdate(combat, changes, context) {
    if (!chris.isLastGM()) return;
    let currentTurn = combat.current.turn;
    let previousTurn = context.effectmacro?.previousTR?.T;
    let currentRound = combat.current.round;
    let previousRound = context.effectmacro?.previousTR?.R;
    if (!changes.turn && !changes.round) return;
    if (!combat.started || !combat.isActive) return;
    if (currentRound < previousRound || (currentTurn < previousTurn && currentTurn === previousRound)) return;
    let token = game.combat.scene.tokens.get(combat.current.tokenId);
    let lastToken = game.combat.scene.tokens.get(combat.previous.tokenId);
    if (token) {
        for (let name of Object.values(triggers)) {
            let validSources = [];
            for (let spell of name) {
                if (spell.turn != 'start') continue;
                let sourceToken = game.combat.scene.tokens.get(spell.sourceTokenID);
                if (!sourceToken) continue;
                if (spell.ignoreSelf && sourceToken.id == token.id) continue;
                if (spell.nonAllies && (token.disposition === sourceToken.disposition || token.disposition === 0)) continue;
                let distance = chris.getDistance(token, sourceToken, spell.wallsBlock);
                if (distance > spell.range || distance == -1) continue;
                validSources.push(spell);
            }
            let maxLevel = Math.max(...validSources.map(spell => spell.castLevel));
            let selectedSpell = validSources.find(spell => spell.castLevel === maxLevel);
            if (selectedSpell) macros.onMove(selectedSpell.macro, token, selectedSpell.castLevel, selectedSpell.spellDC, selectedSpell.damage, selectedSpell.damageType, selectedSpell.sourceTokenID, 'start');
        }
    }
    if (lastToken) {
        for (let name of Object.values(triggers)) {
            let validSources = [];
            for (let spell of name) {
                if (spell.turn != 'end') continue;
                let sourceToken = game.combat.scene.tokens.get(spell.sourceTokenID);
                if (!sourceToken) continue;
                if (spell.ignoreSelf && sourceToken.id == lastToken.id) continue;
                if (spell.nonAllies && (lastToken.disposition === sourceToken.disposition || lastToken.disposition === 0)) continue;
                let distance = chris.getDistance(lastToken, sourceToken);
                if (distance > spell.range) continue;
                validSources.push(spell);
            }
            let maxLevel = Math.max(...validSources.map(spell => spell.castLevel));
            let selectedSpell = validSources.find(spell => spell.castLevel === maxLevel);
            if (selectedSpell) macros.onMove(selectedSpell.macro, lastToken, selectedSpell.castLevel, selectedSpell.spellDC, selectedSpell.damage, selectedSpell.damageType, selectedSpell.sourceTokenID, 'end');
        }
    }
}
async function addTrigger(name, castLevel, spellDC, damage, damageType, sourceTokenID, range, ignoreSelf, nonAllies, turn, effectUuid, offTurnMoveSpecial, wallsBlock) {
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
        'effectUuid': effectUuid,
        'offTurnMoveSpecial': offTurnMoveSpecial,
        'wallsBlock': wallsBlock
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
export let tokenMove = {
    'add': addTrigger,
    'remove': removeTrigger,
    'status': status,
    'purge': purge
}
