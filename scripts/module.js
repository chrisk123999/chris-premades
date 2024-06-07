import {registerHooks} from './hooks.js';
import {setupJournal} from './journal.js';
import {registerMenus, registerSettings} from './settings.js';
import {DialogApp} from './applications/dialog.js';
import {Crosshairs} from './lib/crosshairs.js';
import {registerCustomTypes} from './customTypes.js';
import * as utils from './utils.js';
import * as macros from './macros.js';
import {effectInterface} from './applications/effectInterface.js';
import {macroInterface} from './applications/macroInterface.js';
import {settingButton} from './applications/settings.js';
Hooks.once('init', () => {
    registerSettings();
    if (utils.genericUtils.getCPRSetting('useLocalCompendiums')) utils.constants.setUseLocalCompendium(true);
    registerMenus();
    registerCustomTypes();
    if (utils.genericUtils.getCPRSetting('effectInterface')) effectInterface.init();
    if (utils.genericUtils.getCPRSetting('macroInterface')) macroInterface.init();
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
    utils,
    macros,
    settingButton
};