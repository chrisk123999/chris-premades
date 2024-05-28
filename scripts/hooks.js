import {RollComplete, postAttackRollComplete, postDamageRoll, preItemRoll} from './events/midi.js';
export function registerHooks() {
    Hooks.on('midi-qol.preItemRoll', preItemRoll);
    Hooks.on('midi-qol.postAttackRollComplete', postAttackRollComplete);
    Hooks.on('midi-qol.postDamageRoll', postDamageRoll);
    Hooks.on('midiqol.RollComplete', RollComplete);
    //Hooks.on('updateCombat', updateCombat);
}