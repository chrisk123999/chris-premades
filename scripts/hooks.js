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
import {createHeaderButton, renderItemSheet, renderEffectConfig, renderCompendium} from './extensions/titlebar.js';
import {genericUtils} from './utils.js';
import {chat} from './extensions/chat.js';
import {sidebar} from './extensions/sidebar.js';
import {tokens} from './extensions/tokens.js';
import {backup} from './extensions/backup.js';
import {auras} from './events/auras.js';
import {vae} from './integrations/vae.js';
import {rest} from './events/rest.js';
import {equipment} from './events/equipment.js';
import {initiative} from './extensions/initiative.js';
import {custom} from './events/custom.js';
import {automatedAnimations} from './integrations/automatedAnimations.js';
import {actions} from './extensions/actions.js';
import {item} from './applications/item.js';
export function registerHooks() {
    Hooks.on('createSetting', genericUtils.createUpdateSetting);
    Hooks.on('updateSetting', genericUtils.createUpdateSetting);
    if (genericUtils.getCPRSetting('effectInterface')) effectInterface.ready();
    Hooks.on('changeSidebarTab', sidebar.removeCompendiums);
    Hooks.on('renderCompendiumDirectory', sidebar.removeCompendiums);
    Hooks.on('midi-qol.preTargeting', midiEvents.preTargeting);
    Hooks.on('getItemSheetHeaderButtons', createHeaderButton);
    Hooks.on('getActorSheetHeaderButtons', createHeaderButton);
    Hooks.on('getActiveEffectConfigHeaderButtons', createHeaderButton);
    Hooks.on('renderCompendium', renderCompendium);
    Hooks.on('renderItemSheet', renderItemSheet);
    Hooks.on('renderDAEActiveEffectConfig', renderEffectConfig);
    Hooks.on('preCreateActiveEffect', effects.noAnimation);
    Hooks.on('preDeleteActiveEffect', effects.noAnimation);
    Hooks.on('createChatMessage', chat.createChatMessage);
    Hooks.on('preCreateActiveEffect', effectEvents.preCreateActiveEffect);
    Hooks.on('preUpdateActiveEffect', effectEvents.preUpdateActiveEffect);
    Hooks.on('preCreateMacro', custom.preCreateMacro);
    Hooks.on('updateMacro', custom.updateOrDeleteMacro);
    Hooks.on('deleteMacro', custom.updateOrDeleteMacro);
    if (genericUtils.getCPRSetting('syncActorSizeToTokens')) {
        Hooks.on('preCreateActiveEffect', tokens.preCreateUpdateActiveEffect);
        Hooks.on('preDeleteActiveEffect', tokens.preDeleteActiveEffect);
        Hooks.on('preUpdateActiveEffect', tokens.preCreateUpdateActiveEffect);
    }
    if (genericUtils.getCPRSetting('colorizeBuildABonus')) {
        Hooks.on('renderItemSheet', buildABonus.renderItemSheet);
        Hooks.on('renderDAEActiveEffectConfig', buildABonus.renderDAEActiveEffectConfig);
        Hooks.on('renderActorSheet5e', buildABonus.renderActorSheet5e);
    }
    if (genericUtils.getCPRSetting('babonusOverlappingEffects')) Hooks.on('babonus.filterBonuses', buildABonus.filterBonuses);
    if (genericUtils.getCPRSetting('colorizeDAE', Hooks.on('renderItemSheet', dae.renderItemSheet)));
    if (genericUtils.getCPRSetting('colorizeAutomatedAnimations')) Hooks.on('renderItemSheet', automatedAnimations.renderItemSheet);
    if (genericUtils.getCPRSetting('effectDescriptions') !== 'disabled') Hooks.on('preCreateActiveEffect', effects.preCreateActiveEffect);
    if (genericUtils.getCPRSetting('applyConditionChanges') || genericUtils.getCPRSetting('displayNestedConditions')) Hooks.on('preCreateActiveEffect', conditions.preCreateActiveEffect);
    if (genericUtils.getCPRSetting('vaeButtons')) Hooks.on('visual-active-effects.createEffectButtons', vae.createEffectButtons);
    if (genericUtils.getCPRSetting('updateSummonInitiative')) Hooks.on('dnd5e.rollInitiative', initiative.updateSummonInitiative);
    if (genericUtils.getCPRSetting('updateCompanionInitiative')) Hooks.on('dnd5e.rollInitiative', initiative.updateCompanionInitiative);
    Hooks.on('preUpdateToken', movementEvents.preUpdateToken);
    Hooks.on('preUpdateItem', equipment.addOrUpdate);
    Hooks.on('preDeleteItem', equipment.remove);
    Hooks.on('preCreateItem', equipment.addOrUpdate);
    Hooks.on('dnd5e.restCompleted', rest);
    if (genericUtils.getCPRSetting('addActions')) Hooks.on('createToken', actions.createToken);
    if (genericUtils.getCPRSetting('itemContext')) Hooks.on('dnd5e.getItemContextOptions', item.send);
    if (game.user.isGM) {
        Hooks.on('updateCombat', combatEvents.updateCombat);
        Hooks.on('combatStart', combatEvents.combatStart);
        Hooks.on('deleteCombat', combatEvents.deleteCombat);
        Hooks.on('createActiveEffect', effectEvents.createActiveEffect);
        Hooks.on('deleteActiveEffect', effectEvents.deleteActiveEffect);
        Hooks.on('updateToken', movementEvents.updateToken);
        Hooks.on('createActiveEffect', conditions.createActiveEffect);
        Hooks.on('deleteActiveEffect', conditions.deleteActiveEffect);
        Hooks.on('updateMeasuredTemplate', templateEvents.updateMeasuredTemplate);
        Hooks.on('createToken', auras.createToken);
        Hooks.on('deleteToken', auras.deleteToken);
        Hooks.on('canvasReady', auras.canvasReady);
        Hooks.on('getSceneConfigHeaderButtons', createHeaderButton);
        Hooks.on('getCompendiumHeaderButtons', createHeaderButton);
        auras.canvasReady(canvas);
        if (genericUtils.getCPRSetting('syncActorSizeToTokens')) {
            Hooks.on('createActiveEffect', tokens.createDeleteUpdateActiveEffect);
            Hooks.on('deleteActiveEffect', tokens.createDeleteUpdateActiveEffect);
            Hooks.on('updateActiveEffect', tokens.createDeleteUpdateActiveEffect);
        }
        if (genericUtils.getCPRSetting('backups')) Hooks.on('preCreateActor', backup.preCreateActor);
    }
}