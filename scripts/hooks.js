import {combatStart, updateCombat} from './events/combat.js';
import {RollComplete, postAttackRollComplete, postDamageRoll, preItemRoll} from './events/midi.js';
export function registerHooks() {
    Hooks.on('midi-qol.preItemRoll', preItemRoll);
    Hooks.on('midi-qol.postAttackRollComplete', postAttackRollComplete);
    Hooks.on('midi-qol.DamageRollComplete', postDamageRoll);
    Hooks.on('midi-qol.RollComplete', RollComplete);
    Hooks.on('updateCombat', updateCombat);
    Hooks.on('combatStart', combatStart);
}