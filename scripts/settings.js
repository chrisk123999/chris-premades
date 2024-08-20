import {effectHud} from './applications/effectHud.js';
import {settings, settingsBackup, settingsCompendium, settingsDevelopment, settingsDialog, settingsGeneral, settingsHelp, settingsIntegration, settingsInterface, settingsMechanics} from './applications/settings.js';
import {abilitySave} from './events/abilitySave.js';
import {backup} from './extensions/backup.js';
import {conditions} from './extensions/conditions.js';
import {effects} from './extensions/effects.js';
import {skillCheck} from './events/skillCheck.js';
import {tokens} from './extensions/tokens.js';
import {buildABonus} from './integrations/buildABonus.js';
import {dae} from './integrations/dae.js';
import {gambitPremades} from './integrations/gambitsPremades.js';
import {miscPremades} from './integrations/miscPremades.js';
import {vae} from './integrations/vae.js';
import {constants, genericUtils} from './utils.js';
import {effectInterface} from './applications/effectInterface.js';
import {customTypes} from './extensions/customTypes.js';
function addSetting(options) {
    let setting = {
        scope: options.scope ?? 'world',
        config: false,
        type: options.type,
        default: options.default,
        onChange: options.onChange,
        choices: options.choices,
        reloadRequired: options.reloadRequired,
        select: options.select
    };
    game.settings.register('chris-premades', options.key, setting);
    settings.addMenuSetting(options.key, options.category);
}
function addMenu(options) {
    let menu = {
        name: 'CHRISPREMADES.SettingCategory.' + options.key + '.Name',
        label: 'CHRISPREMADES.SettingCategory.' + options.key + '.Label',
        hint: 'CHRISPREMADES.SettingCategory.' + options.key + '.Hint',
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
        reloadRequired: true,
        onChange: value => {
            if (value) effectInterface.checkEffectItem();
        }
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
            'gambits-premades': 2,
            'midi-item-showcase-community': 3
        },
        category: 'compendium',
    });
    addSetting({
        key: 'monsterCompendium',
        type: String,
        default: 'world.ddb-' + game.world.id + '-ddb-monsters',
        category: 'compendium',
        select: true
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
            1: 'CHRISPREMADES.Settings.Permissions.1',
            2: 'CHRISPREMADES.Settings.Permissions.2',
            3: 'CHRISPREMADES.Settings.Permissions.3',
            4: 'CHRISPREMADES.Settings.Permissions.4'
        }
    });
    addSetting({
        key: 'permissionsAutomateItem',
        type: Number,
        default: 4,
        category: 'general',
        choices: {
            1: 'CHRISPREMADES.Settings.Permissions.1',
            2: 'CHRISPREMADES.Settings.Permissions.2',
            3: 'CHRISPREMADES.Settings.Permissions.3',
            4: 'CHRISPREMADES.Settings.Permissions.4'
        }
    });
    addSetting({
        key: 'permissionsConfigureItem',
        type: Number,
        default: 1,
        category: 'general',
        choices: {
            1: 'CHRISPREMADES.Settings.Permissions.1',
            2: 'CHRISPREMADES.Settings.Permissions.2',
            3: 'CHRISPREMADES.Settings.Permissions.3',
            4: 'CHRISPREMADES.Settings.Permissions.4'
        }
    });
    addSetting({
        key: 'permissionsConfigureHomebrew',
        type: Number,
        default: 4,
        category: 'general',
        choices: {
            1: 'CHRISPREMADES.Settings.Permissions.1',
            2: 'CHRISPREMADES.Settings.Permissions.2',
            3: 'CHRISPREMADES.Settings.Permissions.3',
            4: 'CHRISPREMADES.Settings.Permissions.4'
        }
    });
    addSetting({
        key: 'colorizeBuildABonus',
        type: Boolean,
        default: false,
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
        default: false,
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
        key: 'vaeButtons',
        type: Boolean,
        default: true,
        category: 'integration',
        onChange: value => {
            if (value) {
                Hooks.on('visual-active-effects.createEffectButtons', vae.createEffectButtons);
            } else {
                Hooks.off('visual-active-effects.createEffectButtons', vae.createEffectButtons);
            }
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
    addSetting({
        key: 'backupCompendium',
        type: String,
        default: '',
        category: 'backup',
        select: true
    });
    addSetting({
        key: 'backups',
        type: Boolean,
        default: false,
        category: 'backup',
        onChange: value => {
            if (value) {
                Hooks.on('preCreateActor', backup.preCreateActor);
            } else {
                Hooks.off('preCreateActor', backup.preCreateActor);
            }
        }
    });
    addSetting({
        key: 'backupTime',
        type: Number,
        default: 0,
        category: 'development'
    });
    addSetting({
        key: 'backupFrequency',
        type: Number,
        default: 79200000,
        category: 'backup',
        choices: {
            79200000: 'CHRISPREMADES.Backup.Daily',
            597600000: 'CHRISPREMADES.Backup.Weekly',
            2622546000: 'CHRISPREMADES.Backup.Monthly'
        }
    });
    addSetting({
        key: 'backupRetention',
        type: Number,
        default: 0,
        category: 'backup',
        choices: {
            0: 'CHRISPREMADES.Backup.Forever',
            604800000: 'CHRISPREMADES.Backup.OneWeek',
            1314873000: 'CHRISPREMADES.Backup.HalfMonth',
            2629746000: 'CHRISPREMADES.Backup.OneMonth',
            7890000000: 'CHRISPREMADES.Backup.ThreeMonths',
            15780000000: 'CHRISPREMADES.Backup.SixMonths',
            31536000000: 'CHRISPREMADES.Backup.OneYear'
        }
    });
    addSetting({
        key: 'backupMake',
        type: Object,
        default: null,
        category: 'backup',
        select: true
    });
    let oldEffectDescriptions;
    addSetting({
        key: 'effectDescriptions',
        type: String,
        default: 'disabled',
        category: 'interface',
        choices: {
            disabled: 'CHRISPREMADES.Generic.Disabled',
            chat: 'CHRISPREMADES.Generic.Chat',
            value: 'CHRISPREMADES.Generic.Description'
        },
        onChange: value => {
            if (value !== 'disabled' && oldEffectDescriptions === 'disabled') {
                Hooks.on('preCreateActiveEffect', effects.preCreateActiveEffect);
            } else if (value === 'disabled' && oldEffectDescriptions !== 'disabled') {
                Hooks.off('preCreateActiveEffect', effects.preCreateActiveEffect);
            }
            oldEffectDescriptions = value;
        }
    });
    oldEffectDescriptions = genericUtils.getCPRSetting('effectDescriptions');
    addSetting({
        key: 'effectDescriptionNPC',
        type: Boolean,
        default: false,
        category: 'interface'
    });
    addSetting({
        key: 'hiddenCompendiums',
        type: Array,
        default: [],
        category: 'interface',
        select: true
    });
    addSetting({
        key: 'hiddenCompendiumFolders',
        type: Array,
        default: [],
        category: 'interface',
        select: true
    });
    addSetting({
        key: 'syncActorSizeToTokens',
        type: Boolean,
        default: false,
        category: 'mechanics',
        onChange: value => {
            if (!game.user.isGM) return;
            if (value) {
                Hooks.on('createActiveEffect', tokens.createDeleteUpdateActiveEffect);
                Hooks.on('deleteActiveEffect', tokens.createDeleteUpdateActiveEffect);
                Hooks.on('updateActiveEffect', tokens.createDeleteUpdateActiveEffect);
            } else {
                Hooks.off('createActiveEffect', tokens.createDeleteUpdateActiveEffect);
                Hooks.off('deleteActiveEffect', tokens.createDeleteUpdateActiveEffect);
                Hooks.off('updateActiveEffect', tokens.createDeleteUpdateActiveEffect);
            }
        }
    });
    addSetting({
        key: 'selectTool',
        type: Boolean,
        default: false,
        category: 'interface'
    });
    addSetting({
        key: 'abilitySave',
        type: Boolean,
        default: true,
        category: 'mechanics',
        onChange: value => abilitySave.patch(value)
    });
    addSetting({
        key: 'skillCheck',
        type: Boolean,
        default: true,
        category: 'mechanics',
        onChange: value => skillCheck.patch(value)
    });
    addSetting({
        key: 'gambitPremades',
        type: Number,
        default: 1,
        category: 'integration',
        choices: {
            1: 'CHRISPREMADES.Settings.gambitPremades.1',
            2: 'CHRISPREMADES.Settings.gambitPremades.2',
            3: 'CHRISPREMADES.Settings.gambitPremades.3',
            4: 'CHRISPREMADES.Settings.gambitPremades.4'
        },
        onChange: value => {
            if (game.modules.get('gambits-premades')?.active) gambitPremades.init(value);
        }
    });
    addSetting({
        key: 'miscPremades',
        type: Number,
        default: 1,
        category: 'integration',
        choices: {
            1: 'CHRISPREMADES.Settings.miscPremades.1',
            2: 'CHRISPREMADES.Settings.miscPremades.2',
            3: 'CHRISPREMADES.Settings.miscPremades.3',
            4: 'CHRISPREMADES.Settings.miscPremades.4'
        },
        onChange: value => {
            if (game.modules.get('midi-item-showcase-community')?.active) miscPremades.init(value);
        }
    });
    addSetting({
        key: 'epicRolls',
        type: Boolean,
        default: false,
        category: 'integration'
    });
    addSetting({
        key: 'playerSelectsConjures',
        type: Boolean,
        default: false,
        category: 'mechanics'
    });
    addSetting({
        key: 'lastUpdateCheck',
        type: Number,
        default: 0,
        category: 'development'
    });
    addSetting({
        key: 'checkForUpdates',
        type: Boolean,
        default: true,
        category: 'general'
    });
    addSetting({
        key: 'displayNestedConditions',
        type: Boolean,
        default: false,
        category: 'mechanics'
    });
    addSetting({
        key: 'spotlightOmnisearchSummons',
        type: Boolean,
        default: false,
        category: 'integration'
    });
    addSetting({
        key: 'firearmSupport',
        type: Boolean,
        default: false,
        category: 'mechanics',
        onChange: async (value) => {
            await customTypes.firearm(value);
        }
    });
}
export function registerMenus() {
    if (game.settings.get('chris-premades', 'devTools')) addMenu({
        key: 'development',
        icon: 'fas fa-code',
        type: settingsDevelopment,
    });
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
    addMenu({
        key: 'backup',
        icon: 'fas fa-floppy-disk',
        type: settingsBackup
    });
    addMenu({
        key: 'help',
        icon: 'fas fa-screwdriver-wrench',
        type: settingsHelp
    });
}