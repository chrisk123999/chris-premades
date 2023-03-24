import {registerSettings} from './settings.js';
import {macros, onHitMacro} from './macros.js';
import {setupJournalEntry} from './journal.js';
import {chris as helpers} from './helperFunctions.js';
import {createActorHeaderButton, createHeaderButton, setConfig} from './item.js';
import {queue} from './queue.js';
import {tokenMove, tokenMoved, combatUpdate, updateMoveTriggers, updateGMTriggers, loadTriggers, updateEffectTriggers, updateGMEffectTriggers, effectAura, preActorUpdate, actorUpdate, tokenPlaced} from './movement.js';
import {bab} from './babHelpers.js';
export let socket;
Hooks.once('init', async function() {
	registerSettings();
	setConfig()
});
Hooks.once('socketlib.ready', async function() {
	socket = socketlib.registerModule('chris-premades');
	socket.register('updateMoveTriggers', updateMoveTriggers);
	socket.register('updateGMTriggers', updateGMTriggers);
	socket.register('updateEffectTriggers', updateEffectTriggers);
	socket.register('updateGMEffectTriggers', updateGMEffectTriggers);
});
Hooks.once('ready', async function() {
	if (game.user.isGM) {
		let oldVersion = game.settings.get('chris-premades', 'Breaking Version Change');
		let currentVersion = 1;
		if (oldVersion < currentVersion) {
			let message = '<hr><p>This update to Chris\'s Premades requires you to be using Midi-Qol version 10.0.35 or higher.</p><hr><p><b>All previously added items from this module on actors will need to be replaced to avoid errors.</b></p><hr><p>The CPR Macros folder is no longer needed and is safe to delete.</p>';
			ChatMessage.create({
				speaker: {alias: name},
				content: message
			});
			await game.settings.set('chris-premades', 'Breaking Version Change', 1);
		}
		await setupJournalEntry();
		if (game.settings.get('itemacro', 'charsheet')) ui.notifications.error('Chris\'s Premades & Midi-Qol requires "Character Sheet Hook" in Item Macro\'s module settings to be turned off!');
		Hooks.on('getItemSheetHeaderButtons', createHeaderButton);
		if (game.modules.get('ddb-importer')?.active) Hooks.on('getActorSheet5eHeaderButtons', createActorHeaderButton);
		game.settings.set('chris-premades', 'LastGM', game.user.id);
		if (game.settings.get('chris-premades', 'Combat Listener') && game.user.isGM) Hooks.on('updateCombat', combatUpdate);
		if (game.settings.get('chris-premades', 'Movement Listener') && game.user.isGM) {
			Hooks.on('createToken', tokenPlaced);
			Hooks.on('updateToken', tokenMoved);
		}
		if (game.settings.get('chris-premades', 'Actor Listener') && game.user.isGM) {
			Hooks.on('preUpdateActor', preActorUpdate);
			Hooks.on('updateActor', actorUpdate);
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
	if (game.settings.get('chris-premades', 'Mirror Image')) Hooks.on('midi-qol.AttackRollComplete', macros.mirrorImage);
	if (game.settings.get('chris-premades', 'On Hit')) Hooks.on('midi-qol.RollComplete', onHitMacro);
	if (game.settings.get('chris-premades', 'Protection from Evil and Good')) Hooks.on('midi-qol.preAttackRoll', macros.protectionFromEvilAndGood);
	if (game.settings.get('chris-premades', 'Sanctuary')) Hooks.on('midi-qol.preItemRoll', macros.sanctuary);
	if (game.settings.get('chris-premades', 'Undead Fortitude')) Hooks.on('midi-qol.damageApplied', macros.monster.zombie.undeadFortitude);
	if (game.settings.get('chris-premades', 'Wildhunt')) Hooks.on('midi-qol.preAttackRoll', macros.wildhunt);
});
globalThis['chrisPremades'] = {
	helpers,
	macros,
	queue,
	tokenMove,
	effectAura,
	bab
}