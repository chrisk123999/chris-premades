import {effectInterface} from './applications/effectInterface.js';
import {conditions} from './extensions/conditions.js';
import {effects} from './extensions/effects.js';
import {combatEvents} from './events/combat.js';
import {effectEvents} from './events/effects.js';
import {midiEvents} from './events/midi.js';
import {movementEvents} from './events/movement.js';
import {templateEvents} from './events/template.js';
import {buildABonus} from './integrations/buildABonus.js';
import {dae} from './integrations/dae.js';
import {createHeaderButton, renderItemSheet} from './extensions/titlebar.js';
import {genericUtils} from './utils.js';
import {chat} from './extensions/chat.js';
import {sidebar} from './extensions/sidebar.js';
import {tokens} from './extensions/tokens.js';
export function registerHooks() {
    if (genericUtils.getCPRSetting('effectInterface')) effectInterface.ready();
    Hooks.on('changeSidebarTab', sidebar.removeCompendiums);
    Hooks.on('renderCompendiumDirectory', sidebar.removeCompendiums);
    Hooks.on('midi-qol.preTargetDamageApplication', midiEvents.preTargetDamageApplication);
    Hooks.on('getItemSheetHeaderButtons', createHeaderButton);
    Hooks.on('getActorSheetHeaderButtons', createHeaderButton);
    Hooks.on('getActiveEffectConfigHeaderButtons', createHeaderButton);
    Hooks.on('renderItemSheet', renderItemSheet);
    Hooks.on('preCreateActiveEffect', effects.noAnimation);
    Hooks.on('preDeleteActiveEffect', effects.noAnimation);
    Hooks.on('createChatMessage', chat.createChatMessage);
    if (genericUtils.getCPRSetting('colorizeBuildABonus')) {
        Hooks.on('renderItemSheet', buildABonus.renderItemSheet);
        Hooks.on('renderDAEActiveEffectConfig', buildABonus.renderDAEActiveEffectConfig);
        Hooks.on('renderActorSheet5e', buildABonus.renderActorSheet5e);
    }
    if (genericUtils.getCPRSetting('babonusOverlappingEffects')) Hooks.on('babonus.filterBonuses', buildABonus.filterBonuses);
    if (genericUtils.getCPRSetting('colorizeDAE', Hooks.on('renderItemSheet', dae.renderItemSheet)));
    if (genericUtils.getCPRSetting('effectDescriptions') !== 'disabled') Hooks.on('preCreateActiveEffect', effects.preCreateActiveEffect);
    if (genericUtils.getCPRSetting('applyConditionChanges')) Hooks.on('preCreateActiveEffect', conditions.preCreateActiveEffect);
    if (game.user.isGM) {
        Hooks.on('updateCombat', combatEvents.updateCombat);
        Hooks.on('combatStart', combatEvents.combatStart);
        Hooks.on('createActiveEffect', effectEvents.createActiveEffect);
        Hooks.on('deleteActiveEffect', effectEvents.deleteActiveEffect);
        Hooks.on('preUpdateToken', movementEvents.preUpdateToken);
        Hooks.on('updateToken', movementEvents.updateToken);
        Hooks.on('createActiveEffect', conditions.createActiveEffect);
        Hooks.on('deleteActiveEffect', conditions.deleteActiveEffect);
        Hooks.on('updateMeasuredTemplate', templateEvents.updateMeasuredTemplate);
        if (genericUtils.getCPRSetting('syncActorSizeToTokens')) {
            Hooks.on('preCreateActiveEffect', tokens.preCreateUpdateActiveEffect);
            Hooks.on('preDeleteActiveEffect', tokens.preDeleteActiveEffect);
            Hooks.on('preUpdateActiveEffect', tokens.preCreateUpdateActiveEffect);
            Hooks.on('createActiveEffect', tokens.createDeleteUpdateActiveEffect);
            Hooks.on('deleteActiveEffect', tokens.createDeleteUpdateActiveEffect);
            Hooks.on('updateActiveEffect', tokens.createDeleteUpdateActiveEffect);
        }
    }
}