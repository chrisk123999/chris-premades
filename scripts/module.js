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
        let currentVersion = 4;
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
        await setupJournalEntry();
        if (game.settings.get('chris-premades', 'Tasha Actors')) await tashaSummon.setupFolder();
        if (game.settings.get('itemacro', 'charsheet')) ui.notifications.error('Chris\'s Premades & Midi-Qol requires "Character Sheet Hook" in Item Macro\'s module settings to be turned off!');
        Hooks.on('getItemSheetHeaderButtons', createHeaderButton);
        if (game.modules.get('ddb-importer')?.active) Hooks.on('getActorSheet5eHeaderButtons', createActorHeaderButton);
        game.settings.set('chris-premades', 'LastGM', game.user.id);
        if (game.settings.get('chris-premades', 'Combat Listener')) Hooks.on('updateCombat', combatUpdate);
        if (game.settings.get('chris-premades', 'Movement Listener')) Hooks.on('updateToken', tokenMoved);
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
    if (game.settings.get('chris-premades', 'Defensive Field')) Hooks.on('dnd5e.restCompleted', macros.armorModel.longRest);
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
});
function troubleshoot() {
    console.log('/////////////// Game Information ///////////////');
    console.log('                        Foundry Version: ' + game.version);
    console.log('                         System Version: ' + game.system.version);
    console.log('               Chris\'s Premades Version: ' + game.modules.get('chris-premades')?.version);
    console.log('');
    console.log('                     About Time Version: ' + game.modules.get('about-time')?.version);
    console.log('         Advanced Token Effects Version: ' + game.modules.get('ATL')?.version);
    console.log('           Automated Animations Version: ' + game.modules.get('autoanimations')?.version);
    console.log('                  Build A Bonus Version: ' + game.modules.get('babonus')?.version);
    console.log('             Compendium Folders Version: ' + game.modules.get('compendium-folders')?.version);
    console.log('Custom Character Sheet Sections Version: ' + game.modules.get('autoanimations')?.version);
    console.log('         Dynamic Active Effects Version: ' + game.modules.get('dae')?.version);
    console.log('            D&D Beyond Importer Version: ' + game.modules.get('ddb-importer')?.version);
    console.log('         Dynamic Active Effects Version: ' + game.modules.get('dae')?.version);
    console.log('      DFreds Convenient Effects Version: ' + game.modules.get('dfreds-convenient-effects')?.version);
    console.log('                   Effect Macro Version: ' + game.modules.get('effectmacro')?.version);
    console.log('                Simple Calendar Version: ' + game.modules.get('foundryvtt-simple-calendar')?.version);
    console.log('                       FXMaster Version: ' + game.modules.get('fxmaster')?.version);
    console.log('                     Item Macro Version: ' + game.modules.get('itemacro')?.version);
    console.log('Jules&Ben\'s Animated Assets Version (P): ' + game.modules.get('jb2a_patreon')?.version);
    console.log('Jules&Ben\'s Animated Assets Version (F): ' + game.modules.get('jb2a_dnd5e')?.version);
    console.log('                     libWrapper Version: ' + game.modules.get('lib-wrapper')?.version);
    console.log('                       Midi-Qol Version: ' + game.modules.get('midi-qol')?.version);
    console.log('                   Quick Insert Version: ' + game.modules.get('quick-insert')?.version);
    console.log('                     Small Time Version: ' + game.modules.get('smalltime')?.version);
    console.log('                      Socketlib Version: ' + game.modules.get('socketlib')?.version);
    console.log('                 Template Macro Version: ' + game.modules.get('templatemacro')?.version);
    console.log('                  Tidy 5e Sheet Version: ' + game.modules.get('tidy5e-sheet')?.version);
    console.log('                       Times Up Version: ' + game.modules.get('times-up')?.version);
    console.log('                 Token Attacher Version: ' + game.modules.get('token-attacher')?.version);
    console.log('          Visual Active Effects Version: ' + game.modules.get('visual-active-effects')?.version);
    console.log('                       Warpgate Version: ' + game.modules.get('warpgate')?.version);
    console.log('////////////////////////////////////////////////');
}
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