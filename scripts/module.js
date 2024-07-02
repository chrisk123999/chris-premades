import {registerHooks} from './hooks.js';
import {setupJournal} from './extensions/journal.js';
import {registerMenus, registerSettings} from './settings.js';
import {DialogApp} from './applications/dialog.js';
import {AdditionalCompendiums} from './applications/additionalCompendiums.js';
import {Crosshairs} from './lib/crosshairs.js';
import {registerCustomTypes} from './extensions/customTypes.js';
import * as utils from './utils.js';
import * as macros from './macros.js';
import {effectInterface} from './applications/effectInterface.js';
import {macroInterface} from './applications/macroInterface.js';
import {settingButton} from './applications/settings.js';
import {effectHud} from './applications/effectHud.js';
import {conditions} from './extensions/conditions.js';
import {Summons} from './lib/summons.js';
import {registerSockets} from './lib/sockets.js';
import {workflow} from './extensions/workflow.js';
Hooks.once('socketlib.ready', registerSockets);
Hooks.once('init', () => {
    registerSettings();
    if (utils.genericUtils.getCPRSetting('useLocalCompendiums')) utils.constants.setUseLocalCompendium(true);
    registerMenus();
    registerCustomTypes();
    if (utils.genericUtils.getCPRSetting('effectInterface')) effectInterface.init();
    if (utils.genericUtils.getCPRSetting('macroInterface')) macroInterface.init();
    if (utils.genericUtils.getCPRSetting('temporaryEffectHud')) effectHud.patchToggleEffect(true);
});
Hooks.once('ready', () => {
    workflow.setup();
    registerHooks();
    if (utils.genericUtils.getCPRSetting('disableNonConditionStatusEffects')) conditions.disableNonConditionStatusEffects();
    if (utils.genericUtils.getCPRSetting('replaceStatusEffectIcons')) conditions.setStatusEffectIcons();
    if (utils.genericUtils.getCPRSetting('disableSpecialEffects')) conditions.disableSpecialEffects(true);
    if (game.user.isGM) {
        game.settings.set('chris-premades', 'gmID', game.user.id);
        setupJournal();
    }
});
globalThis['chrisPremades'] = {
    DialogApp,
    Crosshairs,
    AdditionalCompendiums,
    Summons,
    utils,
    macros,
    settingButton
};