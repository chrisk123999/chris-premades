import {registerSettings} from './settings.js';
import {macros, setupWorldMacros, setupMacroFolder, onHitMacro} from './macros.js';
import {setupJournalEntry} from './journal.js';
import {chris as helpers} from './helperFunctions.js';
import {createHeaderButton} from './item.js';
import {queue} from './queue.js';
import {tokenMove, tokenMoved, updateTriggers, combatUpdate} from './movement.js';
Hooks.once('init', async function() {
	registerSettings();
});
Hooks.once('ready', async function() {
	if (game.user.isGM) {
		await setupMacroFolder();
		await setupWorldMacros();
		await setupJournalEntry();
		if (game.settings.get('itemacro', 'charsheet')) ui.notifications.error('Chris\'s Premades & Midi-Qol requires "Character Sheet Hook" in Item Macro\'s module settings to be turned off!');
		Hooks.on('getItemSheetHeaderButtons', createHeaderButton);
		updateTriggers();
	}
	if (game.settings.get('chris-premades', 'Armor of Agathys')) Hooks.on('midi-qol.RollComplete', macros.armorOfAgathys);
	if (game.settings.get('chris-premades', 'Condition Resistance')) {
		Hooks.on('midi-qol.preItemRoll', macros.conditionResistanceEarly);
		Hooks.on('midi-qol.RollComplete', macros.conditionResistanceLate);
	}
	if (game.settings.get('chris-premades', 'Condition Vulnerability')) {
		Hooks.on('midi-qol.preItemRoll', macros.conditionVulnerabilityEarly);
		Hooks.on('midi-qol.RollComplete', macros.conditionVulnerabilityLate);
	}
	if (game.settings.get('chris-premades', 'Darkness')) Hooks.on('midi-qol.preAttackRoll', macros.darkness.hook);
	if (game.settings.get('chris-premades', 'Death Ward')) Hooks.on('midi-qol.damageApplied', macros.deathWard);
	if (game.settings.get('chris-premades', 'Mirror Image')) Hooks.on('midi-qol.AttackRollComplete', macros.mirrorImage);
	if (game.settings.get('chris-premades', 'Protection from Evil and Good')) Hooks.on('midi-qol.preAttackRoll', macros.protectionFromEvilAndGood);
	if (game.settings.get('chris-premades', 'Sanctuary')) Hooks.on('midi-qol.AttackRollComplete', macros.sanctuary);
	if (game.settings.get('chris-premades', 'Defensive Field')) Hooks.on('dnd5e.restCompleted', macros.armorModel.longRest);
	if (game.settings.get('chris-premades', 'DMG Cleave')) Hooks.on('midi-qol.RollComplete', macros.cleave);
	if (game.settings.get('chris-premades', 'Wildhunt')) Hooks.on('midi-qol.preAttackRoll', macros.wildhunt);
	if (game.settings.get('chris-premades', 'On Hit')) Hooks.on('midi-qol.RollComplete', onHitMacro);
	if (game.settings.get('chris-premades', 'Undead Fortitude')) Hooks.on('midi-qol.damageApplied', macros.monster.zombie.undeadFortitude);
	if (game.settings.get('chris-premades', 'Movement Listener') || game.user.isGM) Hooks.on('updateToken', tokenMoved);
	if (game.settings.get('chris-premades', 'Combat Listener') || game.user.isGM) Hooks.on('updateCombat', combatUpdate);
});
globalThis['chrisPremades'] = {
	helpers,
	macros,
	queue,
	tokenMove
}