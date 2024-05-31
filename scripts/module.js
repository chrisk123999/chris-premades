import {registerHooks} from './hooks.js';
import {setupJournal} from './journal.js';
import {registerSettings} from './settings.js';
import {DialogApp} from './applications/dialog.js';
import {Crosshairs} from './lib/crosshairs.js';
import {registerCustomTypes} from './customTypes.js';
import {devUtils, dialogUtils} from './utils.js';
import * as macros from './macros.js';
Hooks.once('init', () => {
    registerSettings();
    registerCustomTypes();
});
Hooks.once('ready', () => {
    registerHooks();
    dialogUtils.updateStrings();
    if (game.user.isGM) {
        game.settings.set('chris-premades', 'gmID', game.user.id);
        setupJournal();
    }
});
globalThis['chrisPremades'] = {
    DialogApp,
    Crosshairs,
    devUtils,
    macros
};