import {effectInterface} from './applications/effectInterface.js';
import {conditions} from './extensions/conditions.js';
import {effects} from './extensions/effects.js';
import {combatEvents} from './events/combat.js';
import {effectEvents} from './events/effects.js';
import {midiEvents} from './events/midi.js';
import {movementEvents} from './events/movement.js';
import {templateEvents} from './events/template.js';
import {dae} from './integrations/dae.js';
import {appendHeaderControl, renderEffectConfig, renderCompendium, renderActivitySheet, copyUuid} from './extensions/titlebar.js';
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
import {activities} from './extensions/activities.js';
import {itemEvent} from './events/item.js';
import {template} from './extensions/template.js';
import {tidy5e} from './integrations/tidy5e.js';
import {combat} from './extensions/combat.js';
import {ddbi} from './integrations/ddbi.js';
export function registerHooks() {
    // Setting caching
    Hooks.on('createSetting', genericUtils.createUpdateSetting);
    Hooks.on('updateSetting', genericUtils.createUpdateSetting);

    // Effect Interface
    if (genericUtils.getCPRSetting('effectInterface')) {
        effectInterface.ready();
        Hooks.on('midi-qol.ready', effectInterface.checkEffectItem);
    }

    // Compendium removal
    Hooks.on('changeSidebarTab', sidebar.removeCompendiums);
    Hooks.on('renderCompendiumDirectory', sidebar.removeCompendiums);

    // Midi events
    Hooks.on('midi-qol.preTargeting', midiEvents.preTargeting);
    Hooks.on('midi-qol.premades.postNoAction', midiEvents.preItemRoll);
    Hooks.on('midi-qol.premades.postPreambleComplete', midiEvents.preambleComplete);
    Hooks.on('midi-qol.premades.postWaitForAttackRoll', midiEvents.postAttackRoll);
    Hooks.on('midi-qol.premades.postAttackRollComplete', midiEvents.attackRollComplete);
    Hooks.on('midi-qol.premades.preDamageRollComplete', midiEvents.damageRollComplete);
    Hooks.on('midi-qol.premades.postSavesComplete', midiEvents.savesComplete);
    Hooks.on('midi-qol.preTargetDamageApplication', midiEvents.preTargetDamageApplication);
    Hooks.on('midi-qol.premades.postRollFinished', midiEvents.rollFinished);

    // DAE Field Browser
    Hooks.on('dae.setFieldData', dae.addFlags);

    // Header buttons
    if (genericUtils.getCPRSetting('addCompendiumButton')) Hooks.on('renderCompendium', renderCompendium);
    Hooks.on('renderActivitySheet', renderActivitySheet);
    Hooks.on('renderDAEActiveEffectConfig', renderEffectConfig);
    Hooks.on('getHeaderControlsItemSheet5e', appendHeaderControl);
    Hooks.on('getHeaderControlsActorSheetV2', appendHeaderControl);
    Hooks.on('getHeaderControlsActiveEffectConfig', appendHeaderControl);
    Hooks.on('getHeaderControlsMeasuredTemplateConfig', appendHeaderControl);
    Hooks.on('getHeaderControlsRegionConfig', appendHeaderControl);

    // Overtime DC helper
    Hooks.on('preCreateActiveEffect', effects.activityDC);
    
    // No-animation hooks
    Hooks.on('preCreateActiveEffect', effects.noAnimation);
    Hooks.on('preDeleteActiveEffect', effects.noAnimation);
    
    // Wire up chat card buttons
    Hooks.on('createChatMessage', chat.createChatMessage);

    // Effect events, conditional hiding, auto-token-image stuff
    Hooks.on('preCreateActiveEffect', effectEvents.preCreateActiveEffect);
    Hooks.on('preUpdateActiveEffect', effectEvents.preUpdateActiveEffect);
    Hooks.on('createActiveEffect', effects.unhideActivities);
    Hooks.on('deleteActiveEffect', effects.rehideActivities);
    Hooks.on('preCreateActiveEffect', effects.preImageCreate);
    Hooks.on('createActiveEffect', effects.imageCreate);
    Hooks.on('deleteActiveEffect', effects.imageRemove);

    // Custom macro
    Hooks.on('preCreateMacro', custom.preCreateMacro);
    Hooks.on('updateMacro', custom.updateOrDeleteMacro);
    Hooks.on('deleteMacro', custom.updateOrDeleteMacro);

    // Sync actor and token size
    if (genericUtils.getCPRSetting('syncActorSizeToTokens')) {
        Hooks.on('preCreateActiveEffect', tokens.preCreateUpdateActiveEffect);
        Hooks.on('preDeleteActiveEffect', tokens.preDeleteActiveEffect);
        Hooks.on('preUpdateActiveEffect', tokens.preCreateUpdateActiveEffect);
    }

    // Colorize headers (TODO: None of this will probably be functional currently, will have to be moved around)
    if (genericUtils.getCPRSetting('colorizeDAE', Hooks.on('renderItemSheetV2', dae.renderItemSheet)));
    if (genericUtils.getCPRSetting('colorizeAutomatedAnimations')) Hooks.on('renderItemSheetV2', automatedAnimations.renderItemSheet);
    
    // Auto-populate effect descriptions
    if (genericUtils.getCPRSetting('effectDescriptions') !== 'disabled') Hooks.on('preCreateActiveEffect', effects.preCreateActiveEffect);
    
    // Apply midi flags to conditions, display nested statuses
    if (genericUtils.getCPRSetting('applyConditionChanges') || genericUtils.getCPRSetting('displayNestedConditions')) Hooks.on('preCreateActiveEffect', conditions.preCreateActiveEffect);
    
    // VAE button integration
    if (genericUtils.getCPRSetting('vaeButtons')) Hooks.on('visual-active-effects.createEffectButtons', vae.createEffectButtons);
    
    // Initiative matching
    if (genericUtils.getCPRSetting('updateSummonInitiative')) Hooks.on('dnd5e.rollInitiative', initiative.updateSummonInitiative);
    if (genericUtils.getCPRSetting('updateCompanionInitiative')) Hooks.on('dnd5e.rollInitiative', initiative.updateCompanionInitiative);

    // Combat extension
    if (genericUtils.getCPRSetting('legendaryActionsPrompt')) {
        Hooks.on('preUpdateActor', combat.legendaryActionsTrack);
        Hooks.on('preUpdateCombat', combat.legendaryActionsPrompt);
    }
    
    // Various events
    Hooks.on('preUpdateItem', activities.flagAllRiders);
    Hooks.on('preUpdateItem', equipment.addOrUpdate);
    Hooks.on('preDeleteItem', equipment.remove);
    Hooks.on('preCreateItem', equipment.addOrUpdate);
    Hooks.on('dnd5e.restCompleted', rest);
    Hooks.on('preCreateMeasuredTemplate', template.preCreateMeasuredTemplate);
    //Hooks.on('preCreateRegion', region.preCreateRegion);

    // Add generic actions to tokens
    if (genericUtils.getCPRSetting('addActions')) Hooks.on('createToken', actions.createToken);

    // Add context menu options to items
    if (genericUtils.getCPRSetting('itemContext')) Hooks.on('dnd5e.getItemContextOptions', item.send);

    // GM-only hooks
    if (game.user.isGM) {
        // Various non-pre events
        Hooks.on('updateCombat', combatEvents.updateCombat);
        Hooks.on('combatStart', combatEvents.combatStart);
        Hooks.on('deleteCombat', combatEvents.deleteCombat);
        Hooks.on('createActiveEffect', effectEvents.createActiveEffect);
        Hooks.on('deleteActiveEffect', effectEvents.deleteActiveEffect);
        Hooks.on('moveToken', movementEvents.moveToken);
        Hooks.on('createActiveEffect', conditions.createActiveEffect);
        Hooks.on('deleteActiveEffect', conditions.deleteActiveEffect);
        Hooks.on('updateMeasuredTemplate', templateEvents.updateMeasuredTemplate);
        Hooks.on('deleteMeasuredTemplate', templateEvents.deleteMeasuredTemplate);
        Hooks.on('createMeasuredTemplate', templateEvents.createMeasuredTemplate);
        Hooks.on('createToken', auras.createToken);
        Hooks.on('deleteToken', auras.deleteToken);
        Hooks.on('canvasReady', auras.canvasReady);
        Hooks.on('createItem', itemEvent.created);
        Hooks.on('deleteItem', itemEvent.deleted);

        // Scene & Compendium medkit
        Hooks.on('getHeaderControlsSceneConfig', appendHeaderControl);
        Hooks.on('getHeaderControlsCompendium', appendHeaderControl);

        // CPR special duration
        Hooks.on('updateActor', effects.specialDurationHitPoints);
        Hooks.on('dnd5e.rollToolCheckV2', effects.specialDurationToolCheck);

        // Aura prep
        auras.canvasReady(canvas);

        // Sync actor and token size
        if (genericUtils.getCPRSetting('syncActorSizeToTokens')) {
            Hooks.on('createActiveEffect', tokens.createDeleteUpdateActiveEffect);
            Hooks.on('deleteActiveEffect', tokens.createDeleteUpdateActiveEffect);
            Hooks.on('updateActiveEffect', tokens.createDeleteUpdateActiveEffect);
        }

        // Backups
        if (genericUtils.getCPRSetting('backups')) Hooks.on('preCreateActor', backup.preCreateActor);
    }

    // Tidy5e Integration
    Hooks.once('tidy5e-sheet.ready', tidy5e.headerControls);
    Hooks.on('renderTidy5eItemSheetClassic', tidy5e.renderTidyItemSheet);
    Hooks.on('renderTidy5eItemSheetQuadrone', tidy5e.renderTidyItemSheet);

    // DDBI Integration
    Hooks.on('ddb-importer.characterProcessDataComplete', itemEvent.actorMunch);
    //Hooks.on('ddb-importer.monsterAddToCompendiumComplete', ddbi.monsterGenerics);

    // Disable AA for things which CPR is going to animate
    Hooks.on('aa.preDataSanitize', automatedAnimations.preDataSanitize);

    // Dev Stuff
    if (genericUtils.getCPRSetting('devTools')) {
        Hooks.on('renderActorSheetV2', copyUuid);
        Hooks.on('renderTokenConfig5e', copyUuid);
        Hooks.on('renderItemSheetV2', copyUuid);
        Hooks.on('renderActivitySheet', copyUuid);
        Hooks.on('renderSceneConfig', copyUuid);
    }
}