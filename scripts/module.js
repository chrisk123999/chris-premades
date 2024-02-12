import {addDAEFlags, colorizeDAETitleBarButton} from './integrations/dae.js';
import {applyEquipmentFlag, itemFeatures, itemFeaturesDelete} from './equipment.js';
import {automatedAnimations} from './integrations/automatedAnimations.js';
import {buildABonus} from './integrations/buildABonus.js';
import {cast} from './macros/animations/cast.js';
import {chris as helpers} from './helperFunctions.js';
import {compendiumRender} from './compendium.js';
import {constants} from './constants.js';
import {createActorHeaderButton, createHeaderButton, updateItemButton} from './item.js';
import {diceSoNice} from './integrations/diceSoNice.js';
import {dndAnimations} from './integrations/dndAnimations.js';
import {effectAuraHooks, effectAuras, effectSockets} from './utility/effectAuras.js';
import {effectTitleBar, fixOrigin, itemDC, noEffectAnimationCreate, noEffectAnimationDelete} from './utility/effect.js';
import {flanking} from './macros/generic/syntheticAttack.js';
import {info, removeFolderFlag, setCompendiumItemInfo, setItemName, stripUnusedFlags, updateAllCompendiums} from './info.js';
import {macros, onHitMacro} from './macros.js';
import {npcRandomizer} from './utility/npcRandomizer.js';
import {patchActiveEffectSourceName, patchSaves, patchSkills} from './patching.js';
import {queue} from './utility/queue.js';
import {registerSettings} from './settings.js';
import {remoteAimCrosshair, remoteDialog, remoteDocumentDialog, remoteDocumentsDialog, remoteMenu} from './utility/remoteDialog.js';
import {removeDumbV10Effects} from './macros/mechanics/conditions.js';
import {rest} from './utility/rest.js';
import {runAsGM, runAsUser} from './runAsGM.js';
import {setConfig} from './config.js';
import {settingButton} from './settingsMenu.js';
import {setupJournalEntry} from './journal.js';
import {summons} from './utility/summons.js';
import {tashaSummon} from './utility/tashaSummon.js';
import {templates} from './utility/templateEffect.js';
import {tokenMove, tokenMoved, combatUpdate, updateMoveTriggers, updateGMTriggers, loadTriggers, tokenMovedEarly} from './utility/movement.js';
import {translate} from './translations.js';
import {troubleshoot} from './help.js';
import {vaeEffectDescription, vaeTempItemButton} from './integrations/vae.js';
import {checkUpdate} from './update.js';
import {firearm} from './macros/mechanics/firearm.js';
import {templateMacroTitleBarButton} from './integrations/templateMacro.js';
import {addActions} from './macros/actions/token.js';
import {summonEffects} from './macros/animations/summonEffects.js';
import {actionsTab} from './integrations/tidy5eSheet.js';
import {tours} from './tours.js';
import {addChatButton} from './chat.js';
export let socket;
Hooks.once('init', async function() {
    registerSettings();
    setConfig();
});
Hooks.once('socketlib.ready', async function() {
    socket = socketlib.registerModule('chris-premades');
    socket.register('updateMoveTriggers', updateMoveTriggers);
    socket.register('updateGMTriggers', updateGMTriggers);
    socket.register('remoteAddEffectAura', effectSockets.remoteAdd);
    socket.register('remoteRemoveEffectAura', effectSockets.remoteRemove);
    socket.register('createCombatant', tashaSummon.createCombatant);
    socket.register('updateCombatant', runAsGM.updateCombatant);
    socket.register('remoteDialog', remoteDialog);
    socket.register('remoteDocumentDialog', remoteDocumentDialog);
    socket.register('remoteDocumentsDialog', remoteDocumentsDialog);
    socket.register('remoteAimCrosshair', remoteAimCrosshair);
    socket.register('remoteMenu', remoteMenu);
    socket.register('updateEffect', runAsGM.updateEffect);
    socket.register('createEffect', runAsGM.createEffect);
    socket.register('removeEffect', runAsGM.removeEffect);
    socket.register('rollItem', runAsUser.rollItem);
});
Hooks.once('ready', async function() {
    if (game.user.isGM) {
        let oldVersion = game.settings.get('chris-premades', 'Breaking Version Change');
        let currentVersion = 9;
        if (oldVersion < currentVersion && oldVersion === 8) {
            let message = '<hr><p>Bardic Inspiration, Mote of Potential, and Magical Inspiration have been split into separate items. You will need to replace the features for them to continue to work.</p>';
            ChatMessage.create({
                'speaker': {'alias': 'Chris\'s Premades'},
                'content': message
            });
            await game.settings.set('chris-premades', 'Breaking Version Change', 9);
            oldVersion = 1;
        }
        await setupJournalEntry();
        await tours.checkTour();
        if (game.settings.get('chris-premades', 'Tasha Actors')) await tashaSummon.setupFolder();
        if (game.modules.get('itemacro')?.active) {
            try {
                if (game.settings.get('itemacro', 'charsheet')) ui.notifications.error('Chris\'s Premades & Midi-Qol requires "Character Sheet Hook" in Item Macro\'s module settings to be turned off!');
            } catch {}
        }
        if (game.modules.get('ddb-importer')?.active) Hooks.on('getActorSheet5eHeaderButtons', createActorHeaderButton);
        game.settings.set('chris-premades', 'LastGM', game.user.id);
        if (game.settings.get('chris-premades', 'Combat Listener')) Hooks.on('updateCombat', combatUpdate);
        if (game.settings.get('chris-premades', 'Movement Listener')) {
            Hooks.on('preUpdateToken', tokenMovedEarly);
            Hooks.on('updateToken', tokenMoved);
        }
        if (game.settings.get('chris-premades', 'Emboldening Bond')) Hooks.on('updateToken', macros.emboldeningBond.move);
        if (game.settings.get('chris-premades', 'Template Listener')) {
            Hooks.on('updateToken', templates.move);
            Hooks.on('updateCombat', templates.combat);
        }
        if (game.settings.get('chris-premades', 'Effect Auras')) {
            Hooks.on('preUpdateActor', effectAuraHooks.preActorUpdate);
            Hooks.on('updateActor', effectAuraHooks.actorUpdate);
            Hooks.on('canvasReady', effectAuraHooks.canvasReady);
            Hooks.on('updateToken', effectAuraHooks.updateToken);
            Hooks.on('createToken', effectAuraHooks.createToken);
            Hooks.on('deleteToken', effectAuraHooks.deleteToken);
            Hooks.on('createActiveEffect', effectAuraHooks.createRemoveEffect);
            Hooks.on('deleteActiveEffect', effectAuraHooks.createRemoveEffect);
            effectAuras.registerAll();
        }
        if (game.settings.get('chris-premades', 'Warding Bond')) {
            Hooks.on('updateToken', macros.wardingBond.moveTarget);
            Hooks.on('updateToken', macros.wardingBond.moveSource);
        }
        if (game.settings.get('chris-premades', 'Compelled Duel')) Hooks.on('updateToken', macros.compelledDuel.movement);
        if (game.settings.get('chris-premades', 'Check For Updates')) checkUpdate();
        Hooks.on('createChatMessage', addChatButton);
    }
    await loadTriggers();
    if (game.settings.get('chris-premades', 'Condition Resistance')) {
        Hooks.on('midi-qol.preItemRoll', macros.conditionResistanceEarly);
        Hooks.on('midi-qol.RollComplete', macros.conditionResistanceLate);
    }
    if (game.settings.get('chris-premades', 'Condition Vulnerability')) {
        Hooks.on('midi-qol.preItemRoll', macros.conditionVulnerabilityEarly);
        Hooks.on('midi-qol.RollComplete', macros.conditionVulnerabilityLate);
    }
    if (game.settings.get('chris-premades', 'Beacon of Hope')) Hooks.on('midi-qol.preTargetDamageApplication', macros.beaconOfHope);
    if (game.settings.get('chris-premades', 'DMG Cleave')) {
        Hooks.on('midi-qol.RollComplete', macros.cleave.hit);
        Hooks.on('midi-qol.preCheckHits', macros.cleave.attack);
        Hooks.on('midi-qol.preDamageRollComplete', macros.cleave.damage);
    }
    if (game.settings.get('chris-premades', 'Darkness')) Hooks.on('midi-qol.preAttackRoll', macros.darkness.hook);
    if (game.settings.get('chris-premades', 'Death Ward')) Hooks.on('midi-qol.preTargetDamageApplication', macros.deathWard);
    if (game.settings.get('chris-premades', 'Rest Listener')) Hooks.on('dnd5e.restCompleted', rest);
    if (game.settings.get('chris-premades', 'Elemental Adept')) {
        Hooks.on('midi-qol.postPreambleComplete', macros.elementalAdept.early);
        Hooks.on('midi-qol.preDamageRollComplete', macros.elementalAdept.damage);
        Hooks.on('midi-qol.RollComplete', macros.elementalAdept.late);
    }
    if (game.settings.get('chris-premades', 'Fog Cloud')) Hooks.on('midi-qol.preAttackRoll', macros.fogCloud.hook);
    if (game.settings.get('chris-premades', 'Mirror Image')) Hooks.on('midi-qol.AttackRollComplete', macros.mirrorImage);
    if (game.settings.get('chris-premades', 'On Hit')) Hooks.on('midi-qol.RollComplete', onHitMacro);
    if (game.settings.get('chris-premades', 'Protection from Evil and Good')) Hooks.on('midi-qol.preAttackRoll', macros.protectionFromEvilAndGood);
    if (game.settings.get('chris-premades', 'Sanctuary')) Hooks.on('midi-qol.preItemRoll', macros.sanctuary.hook);
    if (game.settings.get('chris-premades', 'Shield Guardian')) Hooks.on('midi-qol.preTargetDamageApplication', macros.mastersAmulet);
    if (game.settings.get('chris-premades', 'Undead Fortitude')) Hooks.on('midi-qol.preTargetDamageApplication', macros.monster.zombie.undeadFortitude);
    if (game.settings.get('chris-premades', 'Wildhunt')) Hooks.on('midi-qol.preAttackRoll', macros.wildhunt);
    if (game.settings.get('chris-premades', 'Active Effect Additions')) {
        Hooks.on('preCreateActiveEffect', itemDC);  
        Hooks.on('preCreateActiveEffect', noEffectAnimationCreate);
        Hooks.on('preDeleteActiveEffect', noEffectAnimationDelete);
        Hooks.on('getActiveEffectConfigHeaderButtons', effectTitleBar);
        patchActiveEffectSourceName(true);
    }
    if (game.settings.get('chris-premades', 'Active Effect Origin Fix')) Hooks.on('createToken', fixOrigin);
    if (game.settings.get('chris-premades', 'Automatic VAE Descriptions')) Hooks.on('preCreateActiveEffect', vaeEffectDescription);
    if (game.settings.get('chris-premades', 'VAE Temporary Item Buttons')) Hooks.on('visual-active-effects.createEffectButtons', vaeTempItemButton);
    if (game.settings.get('chris-premades', 'Condition Fixes')) removeDumbV10Effects();
    if (game.settings.get('chris-premades', 'Exploding Heals')) Hooks.on('midi-qol.preDamageRollComplete', macros.explodingHeals);
    if (game.settings.get('chris-premades', 'Attack Listener')) Hooks.on('midi-qol.preAttackRoll', flanking);
    if (game.settings.get('chris-premades', 'Strength of the Grave')) Hooks.on('midi-qol.preTargetDamageApplication', macros.strengthOfTheGrave);
    if (game.settings.get('chris-premades', 'Relentless Endurance')) Hooks.on('midi-qol.preTargetDamageApplication', macros.relentlessEndurance);
    if (game.settings.get('chris-premades', 'Shadow of Moil')) Hooks.on('midi-qol.preAttackRoll', macros.shadowOfMoil.hook);
    if (game.settings.get('chris-premades', 'Emboldening Bond')) Hooks.on('midi-qol.preTargetDamageApplication', macros.emboldeningBond.damage);
    if (game.settings.get('chris-premades', 'Manual Rolls')) {
        Hooks.on('midi-qol.preCheckHits', macros.manualRolls.attackRoll);
        Hooks.on('midi-qol.postCheckSaves', macros.manualRolls.saveRolls);
        Hooks.on('midi-qol.DamageRollComplete', macros.manualRolls.damageRoll);
    }
    if (game.user.isGM || game.settings.get('chris-premades', 'Item Replacer Access') || game.settings.get('chris-premades', 'Item Configuration Access')) {
        Hooks.on('getItemSheetHeaderButtons', createHeaderButton);
        Hooks.on('renderItemSheet', updateItemButton);
    }
    if (game.settings.get('chris-premades', 'Use Randomizer')) Hooks.on('createToken', npcRandomizer);
    if (game.settings.get('chris-premades', 'Skill Patching')) patchSkills(true);
    if (game.settings.get('chris-premades', 'Save Patching')) patchSaves(true);
    if (game.settings.get('chris-premades', 'Dice So Nice')) {
        Hooks.on('midi-qol.preItemRoll', diceSoNice.early);
        Hooks.on('midi-qol.DamageRollComplete', diceSoNice.late)
    }
    if (game.settings.get('chris-premades', 'Arcane Ward')) Hooks.on('midi-qol.preTargetDamageApplication', macros.arcaneWard.damage);
    if (game.settings.get('chris-premades', 'Automation Verification')) Hooks.on('midi-qol.preItemRoll', info);
    if (game.settings.get('chris-premades', 'Item Features')) {
        Hooks.on('preUpdateItem', itemFeatures);
        Hooks.on('preDeleteItem', itemFeaturesDelete);
    }
    if (game.settings.get('chris-premades', 'Baldur\'s Gate 3 Weapon Actions')) {
        Hooks.on('preUpdateItem', macros.bg3.addFeatures);
        Hooks.on('preDeleteItem', macros.bg3.removeFeatures);
        Hooks.on('midi-qol.preDamageRollComplete', macros.bg3.piercingStrike.damage);
        Hooks.on('dnd5e.restCompleted', macros.bg3.rest);
        Hooks.on('midi-qol.RollComplete', macros.bg3.healing);
    }
    if (game.settings.get('chris-premades', 'Cast Animations')) Hooks.on('midi-qol.postPreambleComplete', cast);
    if (game.settings.get('chris-premades', 'Righteous Heritor')) Hooks.on('midi-qol.preTargetDamageApplication', macros.soothePain);
    if (game.settings.get('chris-premades', 'Compelled Duel')) Hooks.on('midi-qol.RollComplete', macros.compelledDuel.attacked);
    Hooks.on('renderCompendium', compendiumRender);
    if (game.modules.get('dae')?.active) addDAEFlags();
    if (game.settings.get('chris-premades', 'Colorize Automated Animations')) {
        automatedAnimations.sortAutoRec();
        Hooks.on('renderItemSheet', automatedAnimations.titleBarButton);
    }
    if (game.settings.get('chris-premades', 'Colorize Build A Bonus')) {
        Hooks.on('renderItemSheet', buildABonus.titleBarButton);
        Hooks.on('renderDAEActiveEffectConfig', buildABonus.daeTitleBarButton);
        Hooks.on('renderActorSheet5e', buildABonus.actorTitleBarButtons);
    }
    if (game.settings.get('chris-premades', 'Colorize Dynamic Active Effects')) Hooks.on('renderItemSheet', colorizeDAETitleBarButton);
    if (game.settings.get('chris-premades', 'Colorize Template Macro')) Hooks.on('renderItemSheet', templateMacroTitleBarButton);
    if (game.settings.get('chris-premades', 'D&D5E Animations Sounds')) {
        dndAnimations.sortAutoRec();
        Hooks.on('midi-qol.AttackRollComplete', dndAnimations.attackDone);
        Hooks.on('midi-qol.DamageRollComplete', dndAnimations.damageDone);
        Hooks.on('midi-qol.RollComplete', dndAnimations.rollDone);
    }
    if (game.settings.get('chris-premades', 'Aura of Life')) {
        Hooks.on('preCreateActiveEffect', macros.auraOfLife.effect);
        Hooks.on('updateActiveEffect', macros.auraOfLife.effect);
    }
    if (game.settings.get('chris-premades', 'Critical Role Firearm Support')) firearm.setup(true);
    if (game.settings.get('chris-premades', 'Booming Blade')) Hooks.on('updateToken', macros.boomingBlade.moved);
    if (game.settings.get('chris-premades', 'Build A Bonus Overlapping Effects')) Hooks.on('babonus.filterBonuses', buildABonus.overlappingEffects);
    if (game.settings.get('chris-premades', 'Manifest Echo')) Hooks.on('dnd5e.rollAbilitySave', macros.manifestEcho.save);
    Hooks.on('createToken', addActions);
});
//Hooks.once('tidy5e-sheet.ready', actionsTab);
let dev = {
    'setCompendiumItemInfo': setCompendiumItemInfo,
    'stripUnusedFlags': stripUnusedFlags,
    'applyEquipmentFlag': applyEquipmentFlag,
    'setItemName': setItemName,
    'removeFolderFlag': removeFolderFlag,
    'checkUpdate': checkUpdate,
    'updateAllCompendiums': updateAllCompendiums
}
globalThis['chrisPremades'] = {
    constants,
    dev,
    effectAuras,
    helpers,
    macros,
    queue,
    settingButton,
    summonEffects,
    summons,
    tashaSummon,
    tokenMove,
    translate,
    troubleshoot
}