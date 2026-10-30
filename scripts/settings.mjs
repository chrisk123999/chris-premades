import {actions} from './macros/legacy/homebrew/bg3WeaponActions.mjs';
import {applications, constants} from './proxy.mjs';
const settings = {
    dmgCleave: {
        type: String,
        default: 'off',
        choices: {
            off: 'CHRISPREMADES.Settings.DmgCleave.Off',
            any: 'CHRISPREMADES.Settings.DmgCleave.Any',
            full: 'CHRISPREMADES.Settings.DmgCleave.Full'
        }
    },
    bg3WeaponActions: {type: Boolean, default: false},
    bg3WeaponActionUses: {type: Number, default: 1},
    ...Object.fromEntries(Object.entries(actions).map(([key, action]) => ['bg3-' + key, {
        type: Array,
        default: action.weapons,
        menu: 'bg3Weapons',
        name: 'CHRISPREMADES.Macros.Legacy.BG3WeaponActions.Weapons.' + key,
        hint: '',
        choices: () => Object.fromEntries(constants.weaponOptions.map(weapon => [weapon.value, weapon.label]))
    }]))
};
export function registerSettings() {
    Object.entries(settings).forEach(([key, options]) => game.settings.register('chris-premades', key, {
        scope: 'world',
        config: false,
        menu: 'homebrew',
        name: 'CHRISPREMADES.Settings.' + key.capitalize() + '.Name',
        hint: 'CHRISPREMADES.Settings.' + key.capitalize() + '.Hint',
        ...options
    }));
    game.settings.registerMenu('chris-premades', 'homebrew', {
        name: 'CHRISPREMADES.Settings.Homebrew.Name',
        label: 'CHRISPREMADES.Settings.Homebrew.Label',
        hint: 'CHRISPREMADES.Settings.Homebrew.Hint',
        icon: 'fas fa-flask',
        restricted: true,
        type: class extends applications.SettingsMenuBase {
            constructor() {
                super('homebrew', {namespace: 'chris-premades', langPrefix: 'CHRISPREMADES', subMenus: ['bg3Weapons']});
            }
        }
    });
}
