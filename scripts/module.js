import {registerSettings} from './settings.js';
import {macros} from './macros.js';
import {chris as helpers} from './helperFunctions.js';

Hooks.once('init', async function() {
	registerSettings();
});

Hooks.once('ready', async function() {
	if (game.settings.get('chris-premades', 'Armor of Agathys')) Hooks.on('midi-qol.RollComplete', macros.armorOfAgathys);
});

globalThis['chrisPremades'] = {
	helpers,
	macros
}