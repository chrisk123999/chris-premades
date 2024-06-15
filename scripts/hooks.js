import {effectInterface} from './applications/effectInterface.js';
import {noAnimation} from './effects.js';
import {combatEvents} from './events/combat.js';
import {effectEvents} from './events/effects.js';
import {midiEvents} from './events/midi.js';
import {movementEvents} from './events/movement.js';
import {buildABonus} from './integrations/buildABonus.js';
import {dae} from './integrations/dae.js';
import {createHeaderButton, renderItemSheet} from './titlebar.js';
import {genericUtils} from './utils.js';
export function registerHooks() {
    if (genericUtils.getCPRSetting('effectInterface')) effectInterface.ready();
    Hooks.on('midi-qol.preItemRoll', midiEvents.preItemRoll);
    Hooks.on('midi-qol.postPreambleComplete', midiEvents.postPreambleComplete);
    Hooks.on('midi-qol.postAttackRollComplete', midiEvents.postAttackRollComplete);
    Hooks.on('midi-qol.DamageRollComplete', midiEvents.postDamageRoll);
    Hooks.on('midi-qol.RollComplete', midiEvents.RollComplete);
    Hooks.on('getItemSheetHeaderButtons', createHeaderButton);
    Hooks.on('getActorSheetHeaderButtons', createHeaderButton);
    Hooks.on('getActiveEffectConfigHeaderButtons', createHeaderButton);
    Hooks.on('renderItemSheet', renderItemSheet);
    Hooks.on('preCreateActiveEffect', noAnimation);
    Hooks.on('preDeleteActiveEffect', noAnimation);
    if (genericUtils.getCPRSetting('colorizeBuildABonus')) {
        Hooks.on('renderItemSheet', buildABonus.renderItemSheet);
        Hooks.on('renderDAEActiveEffectConfig', buildABonus.renderDAEActiveEffectConfig);
        Hooks.on('renderActorSheet5e', buildABonus.renderActorSheet5e);
    }
    if (genericUtils.getCPRSetting('babonusOverlappingEffects')) Hooks.on('babonus.filterBonuses', buildABonus.filterBonuses);
    if (genericUtils.getCPRSetting('colorizeDAE', Hooks.on('renderItemSheet', dae.renderItemSheet)));
    if (game.user.isGM) {
        Hooks.on('updateCombat', combatEvents.updateCombat);
        Hooks.on('combatStart', combatEvents.combatStart);
        Hooks.on('createActiveEffect', effectEvents.createActiveEffect);
        Hooks.on('deleteActiveEffect', effectEvents.deleteActiveEffect);
        Hooks.on('preUpdateToken', movementEvents.preUpdateToken);
        Hooks.on('updateToken', movementEvents.updateToken);
    }
}