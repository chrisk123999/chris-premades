import {registerHooks} from './hooks.js';
import {setupJournal} from './extensions/journal.js';
import {registerMenus, registerSettings} from './settings.js';
import {DialogApp} from './applications/dialog.js';
import {AdditionalCompendiums} from './applications/additionalCompendiums.js';
import {Crosshairs} from './lib/crosshairs.js';
import {customTypes} from './extensions/customTypes.js';
import * as utils from './utils.js';
import * as macros from './macros.js';
import * as legacyMacros from './legacyMacros.js';
import {effectInterface} from './applications/effectInterface.js';
import {settingButton} from './applications/settings.js';
import {effectHud} from './applications/effectHud.js';
import {conditions} from './extensions/conditions.js';
import {Summons} from './lib/summons.js';
import {registerSockets} from './lib/sockets.js';
import {Teleport} from './lib/teleport.js';
import {backup} from './extensions/backup.js';
import {selectTool} from './extensions/selectTool.js';
import {abilitySave} from './events/abilitySave.js';
import {skillCheck} from './events/skillCheck.js';
import {ddbi} from './integrations/ddbi.js';
import {effectEvents} from './events/effects.js';
import {gambitPremades} from './integrations/gambitsPremades.js';
import {miscPremades} from './integrations/miscPremades.js';
import {updateCheck} from './extensions/update.js';
import {troubleshooter} from './applications/troubleshooter.js';
import {spotlightOmnisearch} from './integrations/spotlightOmnisearch.js';
import {custom} from './events/custom.js';
import {tours} from './applications/tour.js';
import {rollResolver} from './extensions/rollResolver.js';
import {dae} from './integrations/dae.js';
import {abilityCheck} from './events/abilityCheck.js';
import {itemDirectory} from './applications/itemDirectory.js';
import {activities} from './extensions/activities.js';
import {migrate} from './migrations.js';
import {initiative} from './extensions/initiative.js';
import {EmbeddedMacros} from './applications/embeddedMacros.js';
import {ui} from './extensions/ui.js';
import {toolCheck} from './events/toolCheck.js';
import {acc} from './integrations/acc.js';
import {quickConditions} from './extensions/quickConditions.js';
import {setupConstants} from './lib/constants.js';
Hooks.once('socketlib.ready', registerSockets);
Hooks.once('init', () => {
    Hooks.on('dae.modifySpecials', dae.modifySpecials);
    registerSettings();
    if (utils.genericUtils.getCPRSetting('useLocalCompendiums')) utils.constants.setUseLocalCompendium(true);
    registerMenus();
    customTypes.init();
    if (utils.genericUtils.getCPRSetting('effectInterface')) effectInterface.init();
    if (utils.genericUtils.getCPRSetting('temporaryEffectHud')) effectHud.patchToggleEffect(true);
    if (utils.genericUtils.getCPRSetting('selectTool') && !game.modules.get('multi-token-edit')?.active && !game.modules.get('select-tool-everywhere')?.active) selectTool.init();
    if (utils.genericUtils.getCPRSetting('spotlightOmnisearchSummons') && game.modules.get('spotlight-omnisearch')?.active) Hooks.on('spotlightOmnisearch.indexBuilt', spotlightOmnisearch.registerSearchTerms);
    if (utils.genericUtils.getCPRSetting('exportForSharing')) {
        Hooks.on('getItemContextOptions', itemDirectory.itemContext);
        Hooks.on('getActorContextOptions', itemDirectory.actorContext);
    }
    ui.configureUI();
    Hooks.callAll('cprInitComplete');
});
Hooks.once('i18nInit', () => {
    dae.initFlags();
    if (utils.genericUtils.getCPRSetting('disableNonConditionStatusEffects')) conditions.disableNonConditionStatusEffects();
    if (utils.genericUtils.getCPRSetting('replaceStatusEffectIcons')) conditions.setStatusEffectIcons();
});
Hooks.once('ready', () => {
    custom.ready();
    effectEvents.ready();
    troubleshooter.startup();
    registerHooks();
    ddbi.ready();
    dae.injectFlags();
    setupConstants();
    if (!game.modules.get('babele')?.active) {
        if (game.modules.get('gambits-premades')?.active) gambitPremades.init(utils.genericUtils.getCPRSetting('gambitPremades'));
        if (game.modules.get('midi-item-showcase-community')?.active) miscPremades.init(utils.genericUtils.getCPRSetting('miscPremades'));
    } else {
        Hooks.once('babele.ready', () => {
            if (game.modules.get('gambits-premades')?.active) gambitPremades.init(utils.genericUtils.getCPRSetting('gambitPremades'));
            if (game.modules.get('midi-item-showcase-community')?.active) miscPremades.init(utils.genericUtils.getCPRSetting('miscPremades'));
        });
    }
    if (utils.genericUtils.getCPRSetting('disableSpecialEffects')) conditions.disableSpecialEffects(true);
    if (utils.genericUtils.getCPRSetting('firearmSupport')) customTypes.firearm(true);
    if (game.user.isGM) {
        game.settings.set('chris-premades', 'gmID', game.user.id);
        setupJournal();
        if (utils.genericUtils.getCPRSetting('backups')) backup.doBackup();
        if (utils.genericUtils.getCPRSetting('checkForUpdates')) updateCheck();
    }
    abilitySave.patch();
    skillCheck.patch();
    abilityCheck.patch();
    activities.patchCanUse();
    toolCheck.patch();
    if (utils.genericUtils.getCPRSetting('groupSummonsWithOwner')) initiative.patch(true);
    if (utils.genericUtils.getCPRSetting('manualRollsGMFulfils')) rollResolver.patch(true);
    if (utils.genericUtils.getCPRSetting('manualRollsEnabled')) {
        rollResolver.registerFulfillmentMethod();
        if (foundry.utils.isNewerVersion('4.3', game.system.version)) rollResolver.patchBuild(true); // remove when 4.3+ only
    }
    tours.checkTour();
    if (utils.genericUtils.getCPRSetting('activityCSSTweak')) activities.cssTweak(true);
    if (!game.user.isGM) return;
    if (utils.genericUtils.getCPRSetting('migrationVersion') !== game.modules.get('chris-premades').version) migrate();
    if (utils.genericUtils.getCPRSetting('quickConditions')) quickConditions.ready();
    Hooks.callAll('cprReady');
});
globalThis['chrisPremades'] = {
    DialogApp,
    Crosshairs,
    AdditionalCompendiums,
    Summons,
    Teleport,
    utils,
    macros,
    legacyMacros,
    settingButton,
    integration: {
        ddbi: ddbi.getAutomation,
        acc
    },
    customMacros: custom.getCustomMacroList,
    doBackup: backup.doBackup,
    EmbeddedMacros
};
