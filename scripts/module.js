import {registerSettings} from './settings.js';
import {macros, onHitMacro} from './macros.js';
import {setupJournalEntry} from './journal.js';
import {chris as helpers} from './helperFunctions.js';
import {createActorHeaderButton, createHeaderButton, setConfig} from './item.js';
import {queue} from './queue.js';
import {tokenMove, tokenMoved, combatUpdate, updateMoveTriggers, updateGMTriggers, loadTriggers} from './movement.js';
import {bab} from './babHelpers.js';
import {effectAuraHooks, effectAuras, effectSockets} from './utility/effectAuras.js';
import {preCreateActiveEffect} from './utility/effect.js';
import {removeDumbV10Effects} from './macros/mechanics/conditions/conditions.js';
import {vaeEffectDescription, vaeTempItemButton} from './vae.js';
import {tashaSummon} from './utility/tashaSummon.js';
import {templates} from './utility/templateEffect.js';
import {rest} from './utility/rest.js';
import {troubleshoot} from './help.js';
import {flanking} from './macros/generic/syntheticAttack.js';
export let socket;
Hooks.once('init', async function() {
    registerSettings();
    setConfig()
});
Hooks.once('socketlib.ready', async function() {
    socket = socketlib.registerModule('chris-premades');
    socket.register('updateMoveTriggers', updateMoveTriggers);
    socket.register('updateGMTriggers', updateGMTriggers);
    socket.register('remoteAddEffectAura', effectSockets.remoteAdd);
    socket.register('remoteRemoveEffectAura', effectSockets.remoteRemove);
    socket.register('createCombatant', tashaSummon.createCombatant);
});
Hooks.once('ready', async function() {
    if (game.user.isGM) {
        let oldVersion = game.settings.get('chris-premades', 'Breaking Version Change');
        let currentVersion = 5;
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
        await setupJournalEntry();
        if (game.settings.get('chris-premades', 'Tasha Actors')) await tashaSummon.setupFolder();
        if (game.settings.get('itemacro', 'charsheet')) ui.notifications.error('Chris\'s Premades & Midi-Qol requires "Character Sheet Hook" in Item Macro\'s module settings to be turned off!');
        Hooks.on('getItemSheetHeaderButtons', createHeaderButton);
        if (game.modules.get('ddb-importer')?.active) Hooks.on('getActorSheet5eHeaderButtons', createActorHeaderButton);
        game.settings.set('chris-premades', 'LastGM', game.user.id);
        if (game.settings.get('chris-premades', 'Combat Listener')) Hooks.on('updateCombat', combatUpdate);
        if (game.settings.get('chris-premades', 'Movement Listener')) Hooks.on('updateToken', tokenMoved);
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
    if (game.settings.get('chris-premades', 'Armor of Agathys')) Hooks.on('midi-qol.RollComplete', macros.armorOfAgathys);
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
    if (game.settings.get('chris-premades', 'Sanctuary')) Hooks.on('midi-qol.preItemRoll', macros.sanctuary);
    if (game.settings.get('chris-premades', 'Shield Guardian')) Hooks.on('midi-qol.damageApplied', macros.mastersAmulet);
    if (game.settings.get('chris-premades', 'Undead Fortitude')) Hooks.on('midi-qol.damageApplied', macros.monster.zombie.undeadFortitude);
    if (game.settings.get('chris-premades', 'Wildhunt')) Hooks.on('midi-qol.preAttackRoll', macros.wildhunt);
    if (game.settings.get('chris-premades', 'Active Effect Additions')) Hooks.on('preCreateActiveEffect', preCreateActiveEffect);
    if (game.settings.get('chris-premades', 'Automatic VAE Descriptions')) Hooks.on('preCreateActiveEffect', vaeEffectDescription);
    if (game.settings.get('chris-premades', 'VAE Temporary Item Buttons')) Hooks.on('visual-active-effects.createEffectButtons', vaeTempItemButton);
    if (game.settings.get('chris-premades', 'Condition Fixes')) removeDumbV10Effects();
    if (game.settings.get('chris-premades', 'Exploding Heals')) Hooks.on('midi-qol.preDamageRollComplete', macros.explodingHeals);
    if (game.settings.get('chris-premades', 'Attack Listener')) Hooks.on('midi-qol.preAttackRoll', flanking);
});
globalThis['chrisPremades'] = {
    helpers,
    macros,
    queue,
    tokenMove,
    effectAuras,
    bab,
    tashaSummon,
    troubleshoot
}