import {effectHud} from './applications/effectHud.js';
import {settings, settingsBackup, settingsCompendium, settingsDevelopment, settingsDialog, settingsGeneral, settingsHelp, settingsHomebrew, settingsIntegration, settingsInterface, settingsManualRolls, settingsMechanics} from './applications/settings.js';
import {backup} from './extensions/backup.js';
import {conditions} from './extensions/conditions.js';
import {effects} from './extensions/effects.js';
import {tokens} from './extensions/tokens.js';
import {buildABonus} from './integrations/buildABonus.js';
import {dae} from './integrations/dae.js';
import {gambitPremades} from './integrations/gambitsPremades.js';
import {miscPremades} from './integrations/miscPremades.js';
import {vae} from './integrations/vae.js';
import {constants, genericUtils} from './utils.js';
import {effectInterface} from './applications/effectInterface.js';
import {customTypes} from './extensions/customTypes.js';
import {initiative} from './extensions/initiative.js';
import {automatedAnimations} from './integrations/automatedAnimations.js';
import {rollResolver} from './extensions/rollResolver.js';
import {actions} from './extensions/actions.js';
import {item} from './applications/item.js';
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
        key: 'spellCompendium',
        type: String,
        default: 'world.ddb-' + game.world.id + '-ddb-spells',
        category: 'compendium',
        select: true
    });
    addSetting({
        key: 'itemCompendium',
        type: String,
        default: 'world.ddb-' + game.world.id + '-ddb-items',
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
        key: 'colorizeAutomatedAnimations',
        type: Boolean,
        default: false,
        category: 'integration',
        onChange: value => {
            if (value) {
                Hooks.on('renderItemSheet', automatedAnimations.renderItemSheet);
            } else {
                Hooks.off('renderItemSheet', automatedAnimations.renderItemSheet);
            }
        }
    });
    addSetting({
        key: 'automatedAnimationSounds',
        type: Boolean,
        default: false,
        category: 'integration'
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
            value: 'DND5E.Description'
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
        onChange: async (value) => await customTypes.firearm(value)
    });
    addSetting({
        key: 'macroCompendium',
        type: String,
        default: null,
        category: 'compendium',
        select: true
    });
    addSetting({
        key: 'updateCompanionInitiative',
        type: Boolean,
        default: false,
        category: 'mechanics',
        onChange: value => {
            if (value) {
                Hooks.on('dnd5e.rollInitiative', initiative.updateCompanionInitiative);
            } else {
                Hooks.off('dnd5e.rollInitiative', initiative.updateCompanionInitiative);
            }
        }
    });
    addSetting({
        key: 'updateSummonInitiative',
        type: Boolean,
        default: false,
        category: 'mechanics',
        onChange: value => {
            if (value) {
                Hooks.on('dnd5e.rollInitiative', initiative.updateSummonInitiative);
            } else {
                Hooks.off('dnd5e.rollInitiative', initiative.updateSummonInitiative);
            }
        }
    });
    addSetting({
        key: 'diceSoNice',
        type: Boolean,
        default: false,
        category: 'integration'
    });
    addSetting({
        key: 'seenTour',
        type: Boolean,
        default: false,
        category: 'development'
    });
    addSetting({
        key: 'classSpellList',
        type: String,
        default: null,
        category: 'general',
        select: true
    });
    let oldAddActions;
    addSetting({
        key: 'addActions',
        type: Number,
        default: 0,
        category: 'mechanics',
        choices: {
            0: 'CHRISPREMADES.Settings.addActions.0',
            1: 'CHRISPREMADES.Settings.addActions.1',
            2: 'CHRISPREMADES.Settings.addActions.2',
            3: 'CHRISPREMADES.Settings.addActions.3',
            4: 'CHRISPREMADES.Settings.addActions.4',
            5: 'CHRISPREMADES.Settings.addActions.5',
            6: 'CHRISPREMADES.Settings.addActions.6',
            7: 'CHRISPREMADES.Settings.addActions.7',
            8: 'CHRISPREMADES.Settings.addActions.8',
            9: 'CHRISPREMADES.Settings.addActions.9'
        },
        onChange: (value) => {
            if (value && !oldAddActions) {
                Hooks.on('createToken', actions.createToken);
            } else if (!value && oldAddActions) {
                Hooks.off('createToken', actions.createToken);
            }
            oldAddActions = value;
        }
    });
    oldAddActions = genericUtils.getCPRSetting('addActions');
    addSetting({
        key: 'manualRollsEnabled',
        type: Boolean,
        default: false,
        category: 'manualRolls',
        onChange: value => {
            if (value) {
                rollResolver.registerFulfillmentMethod();
            } else {
                rollResolver.unregisterFulfillmentMethod();
            }
        }
    });
    addSetting({
        key: 'manualRollsUsers',
        type: Object,
        default: {},
        category: 'manualRolls'
    });
    addSetting({
        key: 'manualRollsInclusion',
        type: Number,
        default: 0,
        category: 'manualRolls',
        choices: {
            0: 'CHRISPREMADES.Settings.manualRollsInclusion.0',
            1: 'CHRISPREMADES.Settings.manualRollsInclusion.1',
            2: 'CHRISPREMADES.Settings.manualRollsInclusion.2',
            3: 'CHRISPREMADES.Settings.manualRollsInclusion.3',
            4: 'CHRISPREMADES.Settings.manualRollsInclusion.4',
            5: 'CHRISPREMADES.Settings.manualRollsInclusion.5'
        }
    });
    addSetting({
        key: 'manualRollsPromptOnMiss',
        type: Boolean,
        default: false,
        category: 'manualRolls',
    });
    addSetting({
        key: 'manualRollsPromptNoData',
        type: Boolean,
        default: false,
        category: 'manualRolls'
    });
    addSetting({
        key: 'explodingHeals',
        type: Boolean,
        default: false,
        category: 'homebrew'
    });
    addSetting({
        key: 'thirdParty',
        type: Boolean,
        default: true,
        category: 'general'
    });
    addSetting({
        key: 'movementPerformance',
        type: Number,
        default: 2,
        category: 'general',
        choices: {
            0: 'CHRISPREMADES.Settings.movementPerformance.0',
            1: 'CHRISPREMADES.Settings.movementPerformance.1',
            2: 'CHRISPREMADES.Settings.movementPerformance.2',
            3: 'CHRISPREMADES.Settings.movementPerformance.3'
        }
    });
    addSetting({
        key: 'cleave',
        type: Number,
        default: 0,
        category: 'mechanics',
        choices: {
            0: 'CHRISPREMADES.Generic.Disabled',
            1: 'CHRISPREMADES.Settings.cleave.1',
            2: 'CHRISPREMADES.Settings.cleave.2'
        }
    });
    addSetting({
        key: 'bg3WeaponActionsEnabled',
        type: Boolean,
        default: false,
        category: 'homebrew',
        onChange: (value) => customTypes.weaponAction(value)
    });
    addSetting({
        key: 'bg3WeaponActionConfig',
        type: Object,
        default: {
            backbreaker: [
                'warhammer',
                'maul'
            ],
            braceMelee: [
                'glaive',
                'pike'
            ],
            cleave: [
                'battleaxe',
                'greateaxe',
                'halberd',
                'greatsword'
            ],
            concussiveSmash: [
                'morningstar',
                'club',
                'lighthammer',
                'mace',
                'warhammer',
                'greatclub',
                'maul',
                'flail'
            ],
            maimingStrike: [
                'warpick',
                'battleaxe'
            ],
            disarmingStrike: [
                'trident'
            ],
            flourish: [
                'scimitar',
                'shortsword',
                'rapier'
            ],
            heartstopper: [
                'morningstar'
            ],
            lacerate: [
                'handaxe',
                'sickle',
                'scimitar',
                'battleaxe',
                'longsword',
                'glaive',
                'greataxe',
                'greatsword',
                'halberd'
            ],
            piercingStrike: [
                'dagger',
                'rapier',
                'shortsword',
                'trident',
                'pike',
                'javelin'
            ],
            pommelStrike: [
                'longsword',
                'greatsword'
            ],
            prepare: [
                'greataxe'
            ],
            rush: [
                'longsword',
                'spear',
                'trident',
                'glaive',
                'halberd',
                'pike'
            ],
            tenacity: [
                'morningstar',
                'greatclub',
                'maul',
                'flail'
            ],
            topple: [
                'quarterstaff'
            ],
            weakeningStrike: [
                'rapier',
                'warpick',
                'warhammer',
                'flail'
            ],
            braceRanged: [
                'heavycrossbow',
                'longbow'
            ],
            hamstringShot: [
                'shortbow',
                'longbow'
            ],
            mobileShot: [
                'handcrossbow'
            ],
            piercingShot: [
                'heavycrossbow',
                'lightcrossbow',
                'handcrossbow'
            ]
        },
        category: 'homebrew'
    });
    addSetting({
        key: 'bg3WeaponActionUses',
        type: Number,
        default: 1,
        category: 'homebrew'
    });
    addSetting({
        key: 'fumbleCompendium',
        type: String,
        default: null,
        category: 'homebrew',
        select: true
    });
    addSetting({
        key: 'criticalCompendium',
        type: String,
        default: null,
        category: 'homebrew',
        select: true
    });
    addSetting({
        key: 'criticalFumbleMode',
        type: Number,
        default: 0,
        category: 'homebrew',
        choices: {
            0: 'CHRISPREMADES.Generic.Disabled',
            1: 'CHRISPREMADES.Settings.criticalFumbleMode.1',
            2: 'CHRISPREMADES.Settings.criticalFumbleMode.2',
            3: 'CHRISPREMADES.Settings.criticalFumbleMode.3',
            4: 'CHRISPREMADES.Settings.criticalFumbleMode.4',
            5: 'CHRISPREMADES.Settings.criticalFumbleMode.5',
            6: 'CHRISPREMADES.Settings.criticalFumbleMode.6',
        }
    });
    addSetting({
        key: 'makeGM',
        type: Object,
        default: null,
        category: 'development'
    });
    addSetting({
        key: 'manualRollsGMFulfils',
        type: Boolean,
        default: false,
        category: 'manualRolls',
        onChange: (value) => rollResolver.patch(value)
    });
    addSetting({
        key: 'addCompendiumButton',
        type: Boolean,
        default: false,
        category: 'interface'
    });
    addSetting({
        key: 'exportForSharing',
        type: Boolean,
        default: false,
        category: 'interface'
    });
    addSetting({
        key: 'itemContext',
        type: Boolean,
        default: false,
        category: 'interface',
        onChange: (value) => {
            if (value) {
                Hooks.on('dnd5e.getItemContextOptions', item.send);
            } else {
                Hooks.off('dnd5e.getItemContextOptions', item.send);
            }
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
        key: 'homebrew',
        icon: 'fas fa-cauldron',
        type: settingsHomebrew
    });
    addMenu({
        key: 'manualRolls',
        icon: 'fas fa-calculator',
        type: settingsManualRolls
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