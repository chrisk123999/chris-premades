import {registerSettings} from './settings.js';
import {macros, setupWorldMacros, setupMacroFolder} from './macros.js';
import {chris as helpers} from './helperFunctions.js';
Hooks.once('init', async function() {
	registerSettings();
});
Hooks.once('ready', async function() {
	if (game.user.isGM) {
		await setupMacroFolder();
		await setupWorldMacros();
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
});
globalThis['chrisPremades'] = {
	helpers,
	macros
}