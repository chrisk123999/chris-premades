import {effectInterface} from './applications/effectInterface.js';
import {combatEvents} from './events/combat.js';
import {effectEvents} from './events/effects.js';
import {midiEvents} from './events/midi.js';
import {movementEvents} from './events/movement.js';
import {createHeaderButton, renderItemSheet} from './titlebar.js';
import {genericUtils} from './utils.js';
export function registerHooks() {
    if (genericUtils.getCPRSetting('effectInterface')) effectInterface.ready();
    Hooks.on('midi-qol.preItemRoll', midiEvents.preItemRoll);
    Hooks.on('midi-qol.postAttackRollComplete', midiEvents.postAttackRollComplete);
    Hooks.on('midi-qol.DamageRollComplete', midiEvents.postDamageRoll);
    Hooks.on('midi-qol.RollComplete', midiEvents.RollComplete);
    if (game.user.isGM) {
        Hooks.on('updateCombat', combatEvents.updateCombat);
        Hooks.on('combatStart', combatEvents.combatStart);
        Hooks.on('createActiveEffect', effectEvents.createActiveEffect);
        Hooks.on('deleteActiveEffect', effectEvents.deleteActiveEffect);
        Hooks.on('updateToken', movementEvents.updateToken);
    }
    Hooks.on('getItemSheetHeaderButtons', createHeaderButton);
    Hooks.on('getActorSheetHeaderButtons', createHeaderButton);
    Hooks.on('renderItemSheet', renderItemSheet);
}