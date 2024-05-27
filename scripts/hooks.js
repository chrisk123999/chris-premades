import {postAttackRollComplete, preItemRoll} from './events/midi.js';
export function registerHooks() {
    Hooks.on('midi-qol.preItemRoll', preItemRoll);
    Hooks.on('midi-qol.postAttackRollComplete', postAttackRollComplete);
}