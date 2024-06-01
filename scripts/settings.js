import {settings, settingsDevelopment, settingsDialog} from './applications/settings.js';
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
        restricted: options.restricted ?? true
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
}