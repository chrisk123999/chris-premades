import {registerSettings} from './settings.js';
import {macros, onHitMacro} from './macros.js';
import {setupJournalEntry} from './journal.js';
import {chris as helpers} from './helperFunctions.js';
import {createActorHeaderButton, createHeaderButton, updateItemButton} from './item.js';
import {queue} from './utility/queue.js';
import {tokenMove, tokenMoved, combatUpdate, updateMoveTriggers, updateGMTriggers, loadTriggers} from './utility/movement.js';
import {effectAuraHooks, effectAuras, effectSockets} from './utility/effectAuras.js';
import {fixOrigin, itemDC} from './utility/effect.js';
import {removeDumbV10Effects} from './macros/mechanics/conditions.js';
import {vaeEffectDescription, vaeTempItemButton} from './integrations/vae.js';
import {tashaSummon} from './utility/tashaSummon.js';
import {templates} from './utility/templateEffect.js';
import {rest} from './utility/rest.js';
import {troubleshoot} from './help.js';
import {flanking} from './macros/generic/syntheticAttack.js';
import {constants} from './constants.js';
import {patchSaves, patchSkills, patching} from './patching.js';
import {runAsGM} from './runAsGM.js';
import {npcRandomizer} from './utility/npcRandomizer.js';
import {settingButton} from './settingsMenu.js';
import {remoteAimCrosshair, remoteDialog, remoteDocumentDialog, remoteDocumentsDialog, remoteMenu} from './utility/remoteDialog.js';
import {diceSoNice} from './integrations/diceSoNice.js';
import {info, removeFolderFlag, setCompendiumItemInfo, setFolder, setItemName, stripUnusedFlags} from './info.js';
import {applyEquipmentFlag, itemFeatures, itemFeaturesDelete} from './equipment.js';
import {setConfig} from './config.js';
import {compendiumRender} from './compendium.js';
import {translate} from './translations.js';
import {cast} from './macros/animations/cast.js';
import {spellsAnimations} from './macros/animations/spellsAnimations.js';
import {addDAEFlags} from './integrations/dae.js';
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
});
Hooks.once('ready', async function() {
    if (game.user.isGM) {
        let oldVersion = game.settings.get('chris-premades', 'Breaking Version Change');
        let currentVersion = 7;
        if (oldVersion < currentVersion && oldVersion === 0) {
            let message = '<hr><p>This update to Chris\'s Premades requires you to be using Midi-Qol version 10.0.35 or higher.</p><hr><p><b>All previously added items from this module on actors will need to be replaced to avoid errors.</b></p><hr><p>The CPR Macros folder is no longer needed and is safe to delete.</p>';
            ChatMessage.create({
                speaker: {alias: name},
                content: message
            });
            await game.settings.set('chris-premades', 'Breaking Version Change', 1);
            oldVersion = 1;
        }
        if (oldVersion < currentVersion && oldVersion === 1) {
            let message2 = '<hr><p>This update to Chris\'s Premades requires the following items to be updated if you are using them:</p><hr><p>Aura of Protection, Aura of Courage, and Aura of Purity.</p>';
            ChatMessage.create({
                speaker: {alias: name},
                content: message2
            });
            await game.settings.set('chris-premades', 'Breaking Version Change', 2);
            oldVersion = 2;
        }
        if (oldVersion < currentVersion && oldVersion === 2) {
            let message2 = '<hr><p>This update to Chris\'s Premades requires you to be using Midi-Qol version 10.0.36 or higher.</p>';
            ChatMessage.create({
                speaker: {alias: name},
                content: message2
            });
            await game.settings.set('chris-premades', 'Breaking Version Change', 3);
            oldVersion = 3;
        }
        if (oldVersion < currentVersion && oldVersion === 3) {
            let message2 = '<hr><p>This update to Chris\'s Premades requires you to be using Midi-Qol version 10.0.45 or higher.</p>';
            ChatMessage.create({
                speaker: {alias: name},
                content: message2
            });
            await game.settings.set('chris-premades', 'Breaking Version Change', 4);
            oldVersion = 4;
        }
        if (oldVersion < currentVersion && oldVersion === 4) {
            let message2 = '<hr><p>This update to Chris\'s Premades requires you to be using Warpgate version 1.17.2 or higher.</p>';
            ChatMessage.create({
                speaker: {alias: name},
                content: message2
            });
            await game.settings.set('chris-premades', 'Breaking Version Change', 5);
            oldVersion = 5;
        }
        if (oldVersion < currentVersion && oldVersion === 5) {
            let message2 = '<hr><p>This update to Chris\'s Premades requires you to be using Midi-Qol version 10.0.46 or higher.</p>';
            ChatMessage.create({
                speaker: {alias: name},
                content: message2
            });
            await game.settings.set('chris-premades', 'Breaking Version Change', 6);
            oldVersion = 6;
        }
        if (oldVersion < currentVersion && oldVersion === 6) {
            let message2 = '<hr><p>This update to Chris\'s Premades added version checking to all automations.  It is recommended to re-apply all automations.</p>';
            ChatMessage.create({
                speaker: {alias: name},
                content: message2
            });
            await game.settings.set('chris-premades', 'Breaking Version Change', 7);
            oldVersion = 7;
        }
        await setupJournalEntry();
        if (game.settings.get('chris-premades', 'Tasha Actors')) await tashaSummon.setupFolder();
        if (game.modules.get('itemacro')?.active) {
            if (game.settings.get('itemacro', 'charsheet')) ui.notifications.error('Chris\'s Premades & Midi-Qol requires "Character Sheet Hook" in Item Macro\'s module settings to be turned off!');
        }
        if (game.modules.get('ddb-importer')?.active) Hooks.on('getActorSheet5eHeaderButtons', createActorHeaderButton);
        game.settings.set('chris-premades', 'LastGM', game.user.id);
        if (game.settings.get('chris-premades', 'Combat Listener')) Hooks.on('updateCombat', combatUpdate);
        if (game.settings.get('chris-premades', 'Movement Listener')) Hooks.on('updateToken', tokenMoved);
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
            effectAuras.registerAll();
        }
        if (game.settings.get('chris-premades', 'Warding Bond')) {
            Hooks.on('updateToken', macros.wardingBond.moveTarget);
            Hooks.on('updateToken', macros.wardingBond.moveSource);
        }
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
    if (game.settings.get('chris-premades', 'Beacon of Hope')) Hooks.on('midi-qol.damageApplied', macros.beaconOfHope);
    if (game.settings.get('chris-premades', 'DMG Cleave')) Hooks.on('midi-qol.RollComplete', macros.cleave);
    if (game.settings.get('chris-premades', 'Darkness')) Hooks.on('midi-qol.preAttackRoll', macros.darkness.hook);
    if (game.settings.get('chris-premades', 'Death Ward')) Hooks.on('midi-qol.damageApplied', macros.deathWard);
    if (game.settings.get('chris-premades', 'Rest Listener')) Hooks.on('dnd5e.restCompleted', rest);
    if (game.settings.get('chris-premades', 'Elemental Adept')) {
        Hooks.on('midi-qol.preambleComplete', macros.elementalAdept.early);
        Hooks.on('midi-qol.preDamageRollComplete', macros.elementalAdept.damage);
        Hooks.on('midi-qol.RollComplete', macros.elementalAdept.late);
    }
    if (game.settings.get('chris-premades', 'Fog Cloud')) Hooks.on('midi-qol.preAttackRoll', macros.fogCloud.hook);
    if (game.settings.get('chris-premades', 'Mirror Image')) Hooks.on('midi-qol.AttackRollComplete', macros.mirrorImage);
    if (game.settings.get('chris-premades', 'On Hit')) Hooks.on('midi-qol.RollComplete', onHitMacro);
    if (game.settings.get('chris-premades', 'Protection from Evil and Good')) Hooks.on('midi-qol.preAttackRoll', macros.protectionFromEvilAndGood);
    if (game.settings.get('chris-premades', 'Sanctuary')) Hooks.on('midi-qol.preItemRoll', macros.sanctuary.hook);
    if (game.settings.get('chris-premades', 'Shield Guardian')) Hooks.on('midi-qol.damageApplied', macros.mastersAmulet);
    if (game.settings.get('chris-premades', 'Undead Fortitude')) Hooks.on('midi-qol.damageApplied', macros.monster.zombie.undeadFortitude);
    if (game.settings.get('chris-premades', 'Wildhunt')) Hooks.on('midi-qol.preAttackRoll', macros.wildhunt);
    if (game.settings.get('chris-premades', 'Active Effect Additions')) Hooks.on('preCreateActiveEffect', itemDC);
    if (game.settings.get('chris-premades', 'Active Effect Origin Fix')) Hooks.on('createToken', fixOrigin);
    if (game.settings.get('chris-premades', 'Automatic VAE Descriptions')) Hooks.on('preCreateActiveEffect', vaeEffectDescription);
    if (game.settings.get('chris-premades', 'VAE Temporary Item Buttons')) Hooks.on('visual-active-effects.createEffectButtons', vaeTempItemButton);
    if (game.settings.get('chris-premades', 'Condition Fixes')) removeDumbV10Effects();
    if (game.settings.get('chris-premades', 'Exploding Heals')) Hooks.on('midi-qol.preDamageRollComplete', macros.explodingHeals);
    if (game.settings.get('chris-premades', 'Attack Listener')) Hooks.on('midi-qol.preAttackRoll', flanking);
    if (game.settings.get('chris-premades', 'Strength of the Grave')) Hooks.on('midi-qol.damageApplied', macros.strengthOfTheGrave);
    if (game.settings.get('chris-premades', 'Relentless Endurance')) Hooks.on('midi-qol.damageApplied', macros.relentlessEndurance);
    if (game.settings.get('chris-premades', 'Shadow of Moil')) Hooks.on('midi-qol.preAttackRoll', macros.shadowOfMoil.hook);
    if (game.settings.get('chris-premades', 'Emboldening Bond')) Hooks.on('midi-qol.damageApplied', macros.emboldeningBond.damage);
    if (game.settings.get('chris-premades', 'Manual Rolls')) {
        Hooks.on('midi-qol.preCheckHits', macros.manualRolls.attackRoll);
        Hooks.on('midi-qol.postCheckSaves', macros.manualRolls.saveRolls);
        await patching();
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
    if (game.settings.get('chris-premades', 'Arcane Ward')) Hooks.on('midi-qol.damageApplied', macros.arcaneWard.damage);
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
    if (game.settings.get('chris-premades', 'Cast Animations')) Hooks.on('midi-qol.preambleComplete', cast);
    if (game.settings.get('chris-premades', 'Generic Spell Animations')) Hooks.on('midi-qol.preambleComplete', spellsAnimations);
    Hooks.on('renderCompendium', compendiumRender);
    if (game.modules.get('dae')?.active) addDAEFlags();
});
let dev = {
    'setCompendiumItemInfo': setCompendiumItemInfo,
    'stripUnusedFlags': stripUnusedFlags,
    'applyEquipmentFlag': applyEquipmentFlag,
    'setItemName': setItemName,
    'removeFolderFlag': removeFolderFlag,
    'setFolder': setFolder
}
globalThis['chrisPremades'] = {
    constants,
    dev,
    effectAuras,
    helpers,
    macros,
    queue,
    settingButton,
    tashaSummon,
    tokenMove,
    translate,
    troubleshoot
}