import {registerHooks} from './hooks.js';
import {setupJournal} from './journal.js';
import {registerSettings} from './settings.js';
import {DialogApp} from './applications/dialog.js';
import {registerCustomTypes} from './customTypes.js';
import {devUtils} from './utils.js';
Hooks.once('init', () => {
    registerSettings();
    registerCustomTypes();
});
Hooks.once('ready', () => {
    registerHooks();
    if (game.user.isGM) {
        game.settings.set('chris-premades', 'gmID', game.user.id);
        setupJournal();
    }
});
globalThis['chrisPremades'] = {
    DialogApp,
    devUtils
};