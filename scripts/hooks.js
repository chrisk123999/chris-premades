import {effectInterface} from './applications/effectInterface.js';
import {conditions} from './extensions/conditions.js';
import {effects} from './extensions/effects.js';
import {combatEvents} from './events/combat.js';
import {effectEvents} from './events/effects.js';
import {midiEvents} from './events/midi.js';
import {movementEvents} from './events/movement.js';
import {templateEvents} from './events/template.js';
import {dae} from './integrations/dae.js';
import {createHeaderButton, renderItemSheet, renderEffectConfig, renderCompendium, renderActivitySheet} from './extensions/titlebar.js';
import {genericUtils, itemUtils} from './utils.js';
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
import {ItemMedkit} from './applications/medkit-item.js';
import {itemEvent} from './events/createItem.js';
import {template} from './extensions/template.js';
import {region} from './extensions/region.js';
export function registerHooks() {
    Hooks.on('createSetting', genericUtils.createUpdateSetting);
    Hooks.on('updateSetting', genericUtils.createUpdateSetting);
    if (genericUtils.getCPRSetting('effectInterface')) {
        effectInterface.ready();
        Hooks.on('midi-qol.ready', effectInterface.checkEffectItem);
    }
    Hooks.on('changeSidebarTab', sidebar.removeCompendiums);
    Hooks.on('renderCompendiumDirectory', sidebar.removeCompendiums);
    Hooks.on('midi-qol.preTargeting', midiEvents.preTargeting);
    Hooks.on('midi-qol.premades.postNoAction', midiEvents.preItemRoll);
    Hooks.on('midi-qol.premades.postPreambleComplete', midiEvents.preambleComplete);
    Hooks.on('midi-qol.premades.postWaitForAttackRoll', midiEvents.postAttackRoll);
    Hooks.on('midi-qol.premades.postAttackRollComplete', midiEvents.attackRollComplete);
    Hooks.on('midi-qol.premades.preDamageRollComplete', midiEvents.damageRollComplete);
    Hooks.on('midi-qol.premades.postSavesComplete', midiEvents.savesComplete);
    Hooks.on('midi-qol.preTargetDamageApplication', midiEvents.preTargetDamageApplication);
    Hooks.on('midi-qol.premades.postRollFinished', midiEvents.rollFinished);
    Hooks.on('dae.setFieldData', dae.addFlags);
    Hooks.on('getItemSheetHeaderButtons', createHeaderButton);
    Hooks.on('getActorSheetHeaderButtons', createHeaderButton);
    Hooks.on('getActiveEffectConfigHeaderButtons', createHeaderButton);
    Hooks.on('renderCompendium', renderCompendium);
    Hooks.on('renderItemSheetV2', renderItemSheet);
    Hooks.on('renderActivitySheet', renderActivitySheet);
    Hooks.on('renderDAEActiveEffectConfig', renderEffectConfig);
    Hooks.on('preCreateActiveEffect', effects.activityDC);
    Hooks.on('preCreateActiveEffect', effects.noAnimation);
    Hooks.on('preDeleteActiveEffect', effects.noAnimation);
    Hooks.on('createChatMessage', chat.createChatMessage);
    Hooks.on('preCreateActiveEffect', effectEvents.preCreateActiveEffect);
    Hooks.on('preUpdateActiveEffect', effectEvents.preUpdateActiveEffect);
    Hooks.on('preCreateActiveEffect', effects.unhideActivities);
    Hooks.on('preDeleteActiveEffect', effects.rehideActivities);
    Hooks.on('preCreateActiveEffect', effects.preImageCreate);
    Hooks.on('createActiveEffect', effects.imageCreate);
    Hooks.on('deleteActiveEffect', effects.imageRemove);
    Hooks.on('preCreateMacro', custom.preCreateMacro);
    Hooks.on('updateMacro', custom.updateOrDeleteMacro);
    Hooks.on('deleteMacro', custom.updateOrDeleteMacro);
    if (genericUtils.getCPRSetting('syncActorSizeToTokens')) {
        Hooks.on('preCreateActiveEffect', tokens.preCreateUpdateActiveEffect);
        Hooks.on('preDeleteActiveEffect', tokens.preDeleteActiveEffect);
        Hooks.on('preUpdateActiveEffect', tokens.preCreateUpdateActiveEffect);
    }
    if (genericUtils.getCPRSetting('colorizeDAE', Hooks.on('renderItemSheetV2', dae.renderItemSheet)));
    if (genericUtils.getCPRSetting('colorizeAutomatedAnimations')) Hooks.on('renderItemSheetV2', automatedAnimations.renderItemSheet);
    if (genericUtils.getCPRSetting('effectDescriptions') !== 'disabled') Hooks.on('preCreateActiveEffect', effects.preCreateActiveEffect);
    if (genericUtils.getCPRSetting('applyConditionChanges') || genericUtils.getCPRSetting('displayNestedConditions')) Hooks.on('preCreateActiveEffect', conditions.preCreateActiveEffect);
    if (genericUtils.getCPRSetting('vaeButtons')) Hooks.on('visual-active-effects.createEffectButtons', vae.createEffectButtons);
    if (genericUtils.getCPRSetting('updateSummonInitiative')) Hooks.on('dnd5e.rollInitiative', initiative.updateSummonInitiative);
    if (genericUtils.getCPRSetting('updateCompanionInitiative')) Hooks.on('dnd5e.rollInitiative', initiative.updateCompanionInitiative);
    Hooks.on('preUpdateToken', movementEvents.preUpdateToken);
    Hooks.on('preUpdateItem', activities.flagAllRiders);
    Hooks.on('preUpdateItem', equipment.addOrUpdate);
    Hooks.on('preDeleteItem', equipment.remove);
    Hooks.on('preCreateItem', equipment.addOrUpdate);
    Hooks.on('dnd5e.restCompleted', rest);
    Hooks.on('preCreateMeasuredTemplate', template.preCreateMeasuredTemplate);
    //Hooks.on('preCreateRegion', region.preCreateRegion);
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
        Hooks.on('createItem', itemEvent.created);
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
    Hooks.once('tidy5e-sheet.ready', (api) => {
        api.registerItemHeaderControls({
            controls: [
                {
                    icon: 'fa-solid fa-kit-medical chris-premades-item',
                    label: 'CHRISPREMADES.Medkit.Medkit',
                    position: 'header',
                    async onClickAction() {
                        await ItemMedkit.item(this.document);
                    }
                }
            ]
        });
    });
    Hooks.on('aa.preDataSanitize', (handler, data) => {
        let shouldCPRAnimate = handler.item?.flags?.['chris-premades']?.info?.hasAnimation && itemUtils.getConfig(handler.item, 'playAnimation');
        if (shouldCPRAnimate) {
            if (genericUtils.getCPRSetting('automatedAnimationSounds')) {
                if (!data.soundOnly?.sound?.enable) {
                    let sound = data.primary?.sound?.enable 
                        ? data.primary.sound 
                        : data.secondary?.sound?.enable
                            ? data.secondary.sound
                            : null;
                    if (sound) genericUtils.setProperty(data, 'soundOnly.sound', sound);
                }
            }
            Hooks.once('aa.preAnimationStart', (sanitizedData) => {
                sanitizedData.macro = false;
                sanitizedData.primary = false;
                sanitizedData.secondary = false;
                sanitizedData.sourceFX = false;
                sanitizedData.tokenFX = false;
            });
        }
    });
}