import {effectHud} from './applications/effectHud.js';
import {settings, settingsCompendium, settingsDevelopment, settingsDialog, settingsInterface, settingsMechanics} from './applications/settings.js';
import {constants} from './utils.js';
function addSetting(options) {
    let setting = {
        scope: options.scope ?? 'world',
        config: false,
        type: options.type,
        default: options.default,
        onChange: options.onChange
    };
    game.settings.register('chris-premades', options.key, setting);
    settings.addMenuSetting(options.key, options.category);
}
function addMenu(options) {
    let menu = {
        name: 'CHRISPREMADES.settingCategory.' + options.key + '.name',
        label: 'CHRISPREMADES.settingCategory.' + options.key + '.label',
        hint: 'CHRISPREMADES.settingCategory.' + options.key + '.hint',
        icon: options.icon,
        type: options.type,
        restricted: options.restricted ?? true,
        reloadRequired: options.reloadRequired ?? false
    };
    game.settings.registerMenu('chris-premades', options.key, menu);
}
export function registerSettings() {
    addSetting({
        key: 'gmID',
        type: String,
        default: '',
        category: 'development'
    });
    addSetting({
        key: 'hideNames',
        type: Boolean,
        default: false,
        category: 'dialog'
    });
    addSetting({
        key: 'effectInterface',
        type: Boolean,
        default: false,
        category: 'interface',
        reloadRequired: true
    });
    addSetting({
        key: 'macroInterface',
        type: Boolean,
        default: false,
        category: 'interface',
        reloadRequired: true
    });
    addSetting({
        key: 'useLocalCompendiums',
        type: Boolean,
        default: false,
        category: 'development',
        onChange: value => constants.setUseLocalCompendium(value)
    });
    addSetting({
        key: 'additionalCompendiums',
        type: Object,
        default: {
            'chris-premades': 1,
            'gambit-premades': 2,
            'midi-item-community-showcase': 3
        },
        category: 'compendium',
    });
    addSetting({
        key: 'temporaryEffectHud',
        type: Boolean,
        default: false,
        category: 'interface',
        onChange: value => effectHud.patchToggleEffect(value)
    });
    addSetting({
        key: 'conditionResistanceAndVulnerability',
        type: Boolean,
        default: true,
        category: 'mechanics'
    });
}
export function registerMenus() {
    addMenu({
        key: 'development',
        icon: 'fas fa-code',
        type: settingsDevelopment,
    }); //Will be commented out when actually released.
    addMenu({
        key: 'dialog',
        icon: 'fas fa-bars',
        type: settingsDialog,
    });
    addMenu({
        key: 'interface',
        icon: 'fas fa-display',
        type: settingsInterface
    });
    addMenu({
        key: 'compendium',
        icon: 'fas fa-atlas',
        type: settingsCompendium
    });
    addMenu({
        key: 'mechanics',
        icon: 'fas fa-dice',
        type: settingsMechanics
    });
}