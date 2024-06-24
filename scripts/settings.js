import {effectHud} from './applications/effectHud.js';
import {settings, settingsCompendium, settingsDevelopment, settingsDialog, settingsGeneral, settingsIntegration, settingsInterface, settingsMechanics} from './applications/settings.js';
import {conditions} from './conditions.js';
import {buildABonus} from './integrations/buildABonus.js';
import {dae} from './integrations/dae.js';
import {vae} from './integrations/vae.js';
import {constants} from './utils.js';
function addSetting(options) {
    let setting = {
        scope: options.scope ?? 'world',
        config: false,
        type: options.type,
        default: options.default,
        onChange: options.onChange,
        choices: options.choices,
        reloadRequired: options.reloadRequired
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
    addSetting({
        key: 'permissionsUpdateItem',
        type: Number,
        default: 4,
        category: 'general',
        choices: {
            1: 'CHRISPREMADES.settings.Permissions.1',
            2: 'CHRISPREMADES.settings.Permissions.2',
            3: 'CHRISPREMADES.settings.Permissions.3',
            4: 'CHRISPREMADES.settings.Permissions.4'
        }
    });
    addSetting({
        key: 'permissionsAutomateItem',
        type: Number,
        default: 4,
        category: 'general',
        choices: {
            1: 'CHRISPREMADES.settings.Permissions.1',
            2: 'CHRISPREMADES.settings.Permissions.2',
            3: 'CHRISPREMADES.settings.Permissions.3',
            4: 'CHRISPREMADES.settings.Permissions.4'
        }
    });
    addSetting({
        key: 'permissionsConfigureItem',
        type: Number,
        default: 1,
        category: 'general',
        choices: {
            1: 'CHRISPREMADES.settings.Permissions.1',
            2: 'CHRISPREMADES.settings.Permissions.2',
            3: 'CHRISPREMADES.settings.Permissions.3',
            4: 'CHRISPREMADES.settings.Permissions.4'
        }
    });
    addSetting({
        key: 'permissionsConfigureHomebrew',
        type: Number,
        default: 4,
        category: 'general',
        choices: {
            1: 'CHRISPREMADES.settings.Permissions.1',
            2: 'CHRISPREMADES.settings.Permissions.2',
            3: 'CHRISPREMADES.settings.Permissions.3',
            4: 'CHRISPREMADES.settings.Permissions.4'
        }
    });
    addSetting({
        key: 'colorizeBuildABonus',
        type: Boolean,
        default: true,
        category: 'integration',
        onChange: value => {
            if (value) {
                Hooks.on('renderItemSheet', buildABonus.renderItemSheet);
                Hooks.on('renderDAEActiveEffectConfig', buildABonus.renderDAEActiveEffectConfig);
                Hooks.on('renderActorSheet5e', buildABonus.renderActorSheet5e);
            } else {
                Hooks.off('renderItemSheet', buildABonus.renderItemSheet);
                Hooks.off('renderDAEActiveEffectConfig', buildABonus.renderDAEActiveEffectConfig);
                Hooks.off('renderActorSheet5e', buildABonus.renderActorSheet5e);
            }
        }
    });
    addSetting({
        key: 'babonusOverlappingEffects',
        type: Boolean,
        default: true,
        category: 'integration',
        onChange: value => {
            if (value) {
                Hooks.on('babonus.filterBonuses', buildABonus.filterBonuses);
            } else {
                Hooks.off('babonus.filterBonuses', buildABonus.filterBonuses);
            }
        }
    });
    addSetting({
        key: 'colorizeDAE',
        type: Boolean,
        default: true,
        category: 'integration',
        onChange: value => {
            if (value) {
                Hooks.on('renderItemSheet', dae.renderItemSheet);
            } else {
                Hooks.off('renderItemSheet', dae.renderItemSheet);
            }
        }
    });
    addSetting({
        key: 'devTools',
        type: Boolean,
        default: false,
        category: 'development',
    });
    addSetting({
        key: 'vaeDescription',
        type: Boolean,
        default: true,
        category: 'integration',
        onChange: value => {
            if (value) {
                Hooks.on('preCreateActiveEffect', vae.preCreateActiveEffect);
            } else {
                Hooks.off('preCreateActiveEffect', vae.preCreateActiveEffect);
            }
        }
    });
    addSetting({
        key: 'vaeDescriptionNPC',
        type: Boolean,
        default: true,
        category: 'integration'
    });
    addSetting({
        key: 'vaeButton',
        type: Boolean,
        default: true,
        category: 'integration',
        onChange: value => {

        }
    });
    addSetting({
        key: 'statusEffectIcons',
        type: Object,
        default: {
            dead: 'icons/svg/skull.svg',
            bleeding: 'modules/chris-premades/images/wounded.svg',
            blinded: 'modules/chris-premades/images/blinded.svg',
            burrowing: 'systems/dnd5e/icons/svg/statuses/burrowing.svg',
            charmed: 'modules/chris-premades/images/charmed.svg',
            concentrating: 'modules/chris-premades/images/concentrating.svg',
            cursed: 'systems/dnd5e/icons/svg/statuses/cursed.svg',
            deafened: 'modules/chris-premades/images/deafened.svg',
            diseased: 'systems/dnd5e/icons/svg/statuses/diseased.svg',
            dodging: 'modules/chris-premades/images/dodging.svg',
            encumbered: 'systems/dnd5e/icons/svg/statuses/encumbered.svg',
            ethereal: 'systems/dnd5e/icons/svg/statuses/ethereal.svg',
            exceedingCarryingCapacity: 'systems/dnd5e/icons/svg/statuses/exceeding-carrying-capacity.svg',
            exhaustion: 'systems/dnd5e/icons/svg/statuses/exhaustion.svg',
            flying: 'systems/dnd5e/icons/svg/statuses/flying.svg',
            frightened: 'modules/chris-premades/images/frightened.svg',
            grappled: 'modules/chris-premades/images/grappled.svg',
            heavilyEncumbered: 'systems/dnd5e/icons/svg/statuses/heavily-encumbered.svg',
            hiding: 'systems/dnd5e/icons/svg/statuses/hiding.svg',
            hovering: 'systems/dnd5e/icons/svg/statuses/hovering.svg',
            incapacitated: 'modules/chris-premades/images/incapacitated.svg',
            invisible: 'modules/chris-premades/images/invisible.svg',
            marked: 'systems/dnd5e/icons/svg/statuses/marked.svg',
            paralyzed: 'modules/chris-premades/images/paralyzed.svg',
            petrified: 'modules/chris-premades/images/petrified.svg',
            poisoned: 'modules/chris-premades/images/poisoned.svg',
            prone: 'modules/chris-premades/images/prone.svg',
            restrained: 'modules/chris-premades/images/restrained.svg',
            silenced: 'systems/dnd5e/icons/svg/statuses/silenced.svg',
            sleeping: 'systems/dnd5e/icons/svg/statuses/sleeping.svg',
            stable: 'systems/dnd5e/icons/svg/statuses/stable.svg',
            stunned: 'modules/chris-premades/images/stunned.svg',
            surprised: 'systems/dnd5e/icons/svg/statuses/surprised.svg',
            transformed: 'systems/dnd5e/icons/svg/statuses/transformed.svg',
            unconscious: 'icons/svg/unconscious.svg',
        },
        category: 'interface'
    });
    addSetting({
        key: 'replaceStatusEffectIcons',
        type: Boolean,
        default: false,
        category: 'interface'
    });
    addSetting({
        key: 'disableNonConditionStatusEffects',
        type: Boolean,
        default: false,
        category: 'interface'
    });
    addSetting({
        key: 'applyConditionChanges',
        type: Boolean,
        default: false,
        category: 'mechanics',
        onChange: value => {
            if (value) {
                Hooks.on('preCreateActiveEffect', conditions.preCreateActiveEffect);
            } else {
                Hooks.off('preCreateActiveEffect', conditions.preCreateActiveEffect); 
            }
        }
    });
    addSetting({
        key: 'disableSpecialEffects',
        type: Boolean,
        default: false,
        category: 'mechanics',
        onChange: value => conditions.disableSpecialEffects(value)
    });
}
export function registerMenus() {
    addMenu({
        key: 'development',
        icon: 'fas fa-code',
        type: settingsDevelopment,
    }); //Will be commented out when actually released.
    addMenu({
        key: 'general',
        icon: 'fas fa-gears',
        type: settingsGeneral
    });
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
    addMenu({
        key: 'integration',
        icon: 'fas fa-puzzle-piece',
        type: settingsIntegration
    });
}