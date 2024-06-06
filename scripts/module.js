import {registerHooks} from './hooks.js';
import {setupJournal} from './journal.js';
import {registerMenus, registerSettings} from './settings.js';
import {DialogApp} from './applications/dialog.js';
import {Crosshairs} from './lib/crosshairs.js';
import {registerCustomTypes} from './customTypes.js';
import {devUtils, genericUtils} from './utils.js';
import * as macros from './macros.js';
import {effectInterface} from './applications/effectInterface.js';
import {macroInterface} from './applications/macroInterface.js';
Hooks.once('init', () => {
    registerSettings();
    registerMenus();
    registerCustomTypes();
    if (genericUtils.getCPRSetting('effectInterface')) effectInterface.init();
    if (genericUtils.getCPRSetting('macroInterface')) macroInterface.init();
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
    Crosshairs,
    devUtils,
    macros
};