import {chris} from './helperFunctions.js';
import {macros} from './macros.js';
let triggers = {};
export function updateTriggers () {
    triggers = game.settings.get('chris-premades', 'Movement Triggers');
    if (!triggers) triggers = {};
}
export function tokenMoved(token, changes) {
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
        if (!selectedSpell) return;
        macros.onMove(selectedSpell.macro, token, selectedSpell.castLevel, selectedSpell.spellDC, selectedSpell.damage, selectedSpell.damageType, selectedSpell.sourceTokenID);
    }
}
export function combatUpdate(combat, changes, context) {
    let currentTurn = combat.current.turn;
    let previousTurn = context.effectmacro?.previousTR?.T;
    let currentRound = combat.current.round;
    let previousRound = context.effectmacro?.previousTR?.T;
    if (!changes.turn && !changes.round) return;
    if (!combat.started || !combat.isActive) return;
    if (currentRound < previousRound || (currentTurn < previousTurn && currentTurn === previousRound)) return;
    let token = canvas.tokens.get(combat.current.tokenId);
    if (!token) return;
    for (let name of Object.values(triggers)) {
        let validSources = [];
        for (let spell of name) {
            if (spell.turn != 'start') continue;
            let sourceToken = canvas.tokens.get(spell.sourceTokenID);
            if (!sourceToken) continue;
            if (spell.ignoreSelf && sourceToken.id == token.id) continue;
            if (spell.nonAllies && (token.document.disposition === sourceToken.document.disposition || token.document.disposition === 0)) continue;
            let distance = chris.getDistance(token, sourceToken);
            if (distance > spell.range) continue;
            validSources.push(spell);
        }
        let maxLevel = Math.max(...validSources.map(spell => spell.castLevel));
        let selectedSpell = validSources.find(spell => spell.castLevel === maxLevel);
        if (!selectedSpell) return;
        macros.onMove(selectedSpell.macro, token.document, selectedSpell.castLevel, selectedSpell.spellDC, selectedSpell.damage, selectedSpell.damageType, selectedSpell.sourceTokenID);
    }
}
async function addTrigger(name, castLevel, spellDC, damage, damageType, sourceTokenID, range, ignoreSelf, nonAllies, turn) {
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
        'macro': name
    }
    if (!triggers[name]) triggers[name] = [];
    triggers[name].push(spell);
    await game.settings.set('chris-premades', 'Movement Triggers', triggers);
}
async function removeTrigger(name, sourceTokenID) {
    if (!triggers[name]) return;
    triggers[name] = triggers[name].filter(spell => spell.sourceTokenID != sourceTokenID);
    if (triggers[name].length === 0) delete(triggers[name]);
    await game.settings.set('chris-premades', 'Movement Triggers', triggers);
}
function status() {
    return triggers;
}
async function purge() {
    triggers = {};
    await game.settings.set('chris-premades', 'Movement Triggers', triggers);
}
export let tokenMove = {
    'add': addTrigger,
    'remove': removeTrigger,
    'status': status,
    'purge': purge
}