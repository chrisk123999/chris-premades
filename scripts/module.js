import {registerSettings} from './scripts/settings.js';
//import {macros} from './scripts/macros.js';
import {chris as helpers} from './scripts/helperFunctions.js';

Hooks.once('init', async function() {
	registerSettings();
});

Hooks.once('ready', async function() {

});

globalThis['chrisPremades'] = {
	helpers
}