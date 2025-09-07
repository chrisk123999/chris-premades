import {custom} from '../events/custom.js';
import {genericUtils, socketUtils} from '../utils.js';
let names = {
    'ATL': 'Active Token Effects',
    'JB2A_DnD5e': 'Jules&Ben\'s Animated Assets (F)',
    'about-time': 'About Time',
    'animated-spell-effects-cartoon': 'Animated Spell Effects: Cartoon',
    'autoanimations': 'Automated Animations',
    'compendium-folders': 'Compendium Folders',
    'custom-character-sheet-sections': 'Custom Character Sheet Sections',
    'dae': 'Dynamic Active Effects',
    'ddb-importer': 'D&D Beyond Importer',
    'dfreds-convenient-effects': 'DFreds Convenient Effects',
    'dice-so-nice': 'Dice So Nice!',
    'effectmacro': 'Effect Macro',
    'foundryvtt-simple-calendar': 'Simple Calendar',
    'fxmaster': 'FXMaster',
    'itemacro': 'Item Macro',
    'jb2a_patreon': 'Jules&Ben\'s Animated Assets (P)',
    'lib-wrapper': 'libWrapper',
    'midi-qol': 'Midi-Qol',
    'quick-insert': 'Quick Insert',
    'sequencer': 'Sequencer',
    'smalltime': 'Small Time',
    'socketlib': 'Socketlib',
    'templatemacro': 'Template Macro',
    'tidy5e-sheet': 'Tidy 5e Sheet',
    'times-up': 'Times Up',
    'token-attacher': 'Token Attacher',
    'visual-active-effects': 'Visual Active Effects',
    'warpgate': 'Warpgate',
    'universal-animations': 'Universal Animations',
    'gambits-premades': 'Gambit\'s Premades',
    'midi-item-showcase-community': 'Midi Item Showcase - Community',
    'automated-conditions-5e': 'Automated Conditions 5e',
    'bugs': 'Bugbear\'s Scripts',
    'multilevel-tokens': 'Multilevel Tokens',
    'monks-wall-enhancement': 'Monk\'s Wall Enhancement',
    'simbuls-cover-calculator': 'Simbul\'s Cover Calculator',
    'tokencover': 'Alternative Token Cover',
    'levelsautocover': 'Levels - Automatic Cover Calculator'
};
let optionalModules = [
    'ATL',
    'about-time',
    'animated-spell-effects-cartoon',
    'custom-character-sheet-sections',
    'ddb-importer',
    'dice-so-nice',
    'foundryvtt-simple-calendar',
    'fxmaster',
    'JB2A_DnD5e',
    'jb2a_patreon',
    'quick-insert',
    'smalltime',
    'tidy5e-sheet',
    'visual-active-effects',
    'universal-animations',
    'gambits-premades',
    'midi-item-showcase-community',
    'tokenmagic'
];
let incompatibleModules = [
    'advancedspelleffects',
    'attack-roll-check-5e',
    'betterrolls5e',
    'dice-rng-protector',
    'dice-tooltip',
    'effective-transferral',
    'faster-rolling-by-default-5e',
    'gm-paranoia-taragnor',
    'heartbeat',
    'max-crit',
    'mre-dnd5e',
    'multiattack-5e',
    'obsidian',
    'quick-rolls',
    'ready-set-roll-5e',
    'retroactive-advantage-5e',
    'rollgroups',
    'wire',
    'multilevel-tokens'
];
let defunctModules = [
    'itemacro',
    'compendium-folders',
    'select-tool-everywhere',
    'sidebar-macros',
    'temp-effects-as-statuses',
    'concentrationnotifier',
    'warpgate',
    'dfreds-convenient-effects'
];
let otherModules = [
    'automated-conditions-5e',
    'bugs',
    'autoanimations',
    'monks-wall-enhancement'
];
export async function run() {
    let output = '';
    function addLine(text) {
        output += '\n' + text;
        console.log(text);
    }
    function checkModule(name) {
        let module = game.modules.get(name);
        let text;
        if (module) {
            if (names[name]) {
                text = names[name] + ': ' + module.version;
            } else {
                text = module.title + ': ' + module.version;
            }
            if (!module.active) text += ' (Disabled)';
        } else {
            text = names[name] + ': Missing!';
        }
        return text;
    }
    addLine('/////////////// Game Information ///////////////');
    addLine('Foundry: ' + game.version);
    addLine('System: ' + game.system.version);
    addLine('Language: ' + game.settings.get('core', 'language'));
    let cpr = game.modules.get('chris-premades');
    if (cpr.version === '#{VERSION}#') {
        addLine('Cauldron of Plentiful Resources Version: Development');
    } else {
        addLine('Cauldron of Plentiful Resources Version: ' + game.modules.get('chris-premades').version);
    }
    addLine('');
    addLine('/////////////// Required Modules ///////////////');
    let requiredModules = new Set([]);
    game.modules.get('chris-premades').relationships.requires.forEach(value => {
        requiredModules.add(value.id);
        let module = game.modules.get(value.id);
        if (module) game.modules.get(value.id).relationships.requires.forEach(value => {
            requiredModules.add(value.id);
        });
    });
    Array.from(requiredModules).sort().forEach(value => {
        addLine(checkModule(value));
    });
    addLine('');
    let defunctModulesCount = defunctModules.reduce((count, i) => {
        if (game.modules.get(i)) return 1;
    }, 0);
    if (defunctModulesCount > 0) {
        addLine('/////////////// Defunct Modules ///////////////');
        defunctModules.forEach(id => {
            if (game.modules.get(id)) addLine(checkModule(id));
        });
        addLine('');
    }
    addLine('/////////////// Optional Modules ///////////////');
    optionalModules.forEach(id => {
        addLine(checkModule(id));
    });
    addLine('');
    let incompatibleModuleCount = incompatibleModules.reduce((count, i) => {
        if (game.modules.get(i)) return 1;
    }, 0);
    if (incompatibleModuleCount > 0) {
        addLine('/////////////// Incompatible Modules ///////////////');
        incompatibleModules.forEach(id => {
            if (game.modules.get(id)) addLine(checkModule(id));
        });
        addLine('');
    }
    let otherModulesCount = otherModules.reduce((count, i) => {
        if (game.modules.get(i)) return 1;
    });
    if (otherModulesCount > 0) {
        addLine('/////////////// Other Modules ///////////////');
        otherModules.forEach(id => {
            if (game.modules.get(id)) addLine(checkModule(id));
        });
        addLine('');
    }
    addLine('/////////////// CPR Settings ///////////////');
    let cprSettings = Array.from(game.settings.settings).filter(i => i[0].includes('chris-premades') && i[1].namespace === 'chris-premades');
    cprSettings.forEach(i => {
        addLine(genericUtils.translate('CHRISPREMADES.Settings.' + i[1].key + '.Name') + ': ' + game.settings.get('chris-premades', i[1].key));
    });
    let customMacros = custom.getCustomMacroList();
    if (customMacros.length) {
        addLine('');
        addLine('/////////////// CPR Custom Macros ///////////////');
        customMacros.forEach(i => {
            addLine(' - ' + i.identifier);
        });
    }
    if (game.modules.get('midi-qol')?.active) {
        addLine('');
        addLine('/////////////// Midi-Qol Settings ///////////////');
        addLine('Roll Automation Support: ' + game.settings.get('midi-qol', 'EnableWorkflow'));
        let midiSettings = game.settings.get('midi-qol', 'ConfigSettings');
        console.log(midiSettings);
        switch(midiSettings.autoCEEffects) {
            case 'none':
                addLine('Apply Convenient Effects: None');
                break;
            case 'itempri':
                addLine('Apply Convenient Effects: Items > CE');
                break;
            case 'cepri':
                addLine('Apply Convenient Effects: CE > Items');
                break;
            case 'both':
                addLine('Apply Convenient Effects: Both');
                break;
        }
        addLine('Roll Seperate Attack Per Target: ' + midiSettings.attackPerTarget);
        //addLine('Merge Card: ' + midiSettings.mergeCard);
        addLine('Actor On Use: ' + midiSettings.allowActorUseMacro);
        addLine('Item On Use: ' + midiSettings.allowUseMacro);
        addLine('Player Auto Roll Damage: ' + midiSettings.autoRollDamage);
        addLine('GM Auto Roll Damage: ' + midiSettings.gmAutoDamage);
        addLine('Confirm Rolls: ' + midiSettings.confirmAttackDamage);
        addLine('Wait For Damage Application: ' + midiSettings.waitForDamageApplication);
        addLine('Auto Complete Workflow: ' + midiSettings.autoCompleteWorkflow);
    }
    try {
        if (game.modules.get('levelsautocover')?.active) {
            addLine('');
            addLine('/////////////// Levels - Automatic Cover Calculator Settings ///////////////');
            addLine('API Mode Enabled: ' + game.settings.get('levelsautocover', 'apiMode'));
            addLine('Tokens Provide Cover: ' + game.settings.get('levelsautocover', 'tokensProvideCover'));
            addLine('Active Effects Enabled: ' + game.settings.get('levelsautocover', 'enableActiveEffect'));
            addLine('Precision: ' + game.settings.get('levelsautocover', 'coverRestriction'));
        }
        if (game.modules.get('simbuls-cover-calculator')?.active) {
            addLine('');
            addLine('/////////////// Simbul\'s Cover Calculator Settings ///////////////');
            addLine('Computation Mode: ' + game.settings.settings.get('simbuls-cover-calculator.losSystem').choices[game.settings.get('simbuls-cover-calculator', 'losSystem')]);
            addLine('Compute on Target: ' + game.settings.get('simbuls-cover-calculator', 'losOnTarget'));
            addLine('Tile Cover: ' + game.settings.get('simbuls-cover-calculator', 'losWithTiles'));
            addLine('Token Cover: ' + game.settings.get('simbuls-cover-calculator', 'losWithTokens'));
            addLine('Cover Application: ' + game.settings.settings.get('simbuls-cover-calculator.coverApplication').choices[game.settings.get('simbuls-cover-calculator', 'coverApplication')]);
        }
        if (game.modules.get('tokencover')?.active) {
            addLine('');
            addLine('/////////////// Alternative Token Cover Settings ///////////////');
            addLine('Viewer Points: ' + game.settings.settings.get('tokencover.los-points-viewer').choices[game.settings.get('tokencover', 'los-points-viewer')]);
            addLine('Large Token Subtargeting: ' + game.settings.get('tokencover', 'los-large-target'));
            addLine('Target Points: ' + game.settings.settings.get('tokencover.los-points-target').choices[game.settings.get('tokencover', 'los-points-target')]);
            addLine('3D Points Enabled: ' + game.settings.get('tokencover', 'los-points-3d'));
            addLine('Use Cover Effect: ' + game.settings.get('tokencover', 'use-cover-effects'));
            addLine('Effect When Targeting: ' + game.settings.get('tokencover', 'cover-effects-targeting'));
        }
        if (game.modules.get('monks-wall-enhancement')?.active) {
            addLine('');
            addLine('/////////////// Monk\'s Wall Enhancement Settings ///////////////');
            addLine('Allow One Way Doors: ' + game.settings.get('monks-wall-enhancement', 'allow-one-way-doors'));
        }
        if (game.modules.get('tokenmagic')?.active) {
            addLine('');
            addLine('/////////////// Token Magic FX Settings ///////////////');
            addLine('Automatic Template Effects: ' + game.settings.get('tokenmagic', 'autoTemplateEnabled'));
            addLine('Template Grid On Hover: ' + game.settings.get('tokenmagic', 'defaultTemplateOnHover'));
            addLine('Hide Template Elements: ' + game.settings.get('tokenmagic', 'autohideTemplateElements'));
        }
    } catch (error) { /* empty */ }
    let scene = canvas.scene;
    if (scene) {
        addLine('');
        addLine('/////////////// Scene Details ///////////////');
        addLine('Drawings: ' + scene.drawings.size);
        addLine('Lights: ' + scene.lights.size);
        addLine('Notes: ' + scene.notes.size);
        addLine('Regions: ' + scene.regions.size);
        addLine('Sounds: ' + scene.sounds.size);
        addLine('Templates: ' + scene.templates.size);
        addLine('Tiles: ' + scene.tiles.size);
        addLine('Tokens: ' + scene.tokens.size);
        let nonActors = scene.tokens.filter(i => !i.actor);
        addLine('Actorless Tokens: ' + nonActors.length);
        addLine('Walls: ' + scene.tokens.size);
        addLine('Global Light: ' + scene.environment.globalLight.enabled);
    }
    addLine('');
    addLine('/////////////// Game Details ///////////////');
    addLine('Actors: ' + game.actors.size);
    addLine('Invalid Actors: ' + game.actors.invalidDocumentIds.size);
    addLine('Items: ' + game.items.size);
    addLine('Invalid Items: ' + game.items.invalidDocumentIds.size);
    addLine('Scenes: ' + game.scenes.size);
    addLine('Invalid Scenes: ' + game.scenes.invalidDocumentIds.size);
    addLine('Tables: ' + game.tables.size);
    addLine('Invalid Tables: ' + game.tables.invalidDocumentIds.size);
    addLine('Macros: ' + game.macros.size);
    addLine('Invalid Macros: ' + game.macros.invalidDocumentIds.size);
    let selectedTokens = canvas.tokens.controlled;
    if (selectedTokens.length) {
        let token = selectedTokens[0];
        addLine('');
        addLine('/////////////// Token Details ///////////////');
        if (token.document) {
            addLine('Name: ' + token.document.name);
            addLine('Linked: ' + token.document.actorLink);
            let detectionModes = token.document.detectionModes;
            if (!detectionModes.length) {
                addLine('Vision Enabled: false');
            } else {
                detectionModes.forEach(i => {
                    addLine(i.id.capitalize() + ': ' + i.enabled);
                });
            }
            addLine('Size: ' + token.document.width);
            addLine('Scale: ' + token.document.texture.scaleX);
            addLine('Uuid: ' + token.document.uuid);
        }
        if (!token.actor) {
            addLine('Missing Actor: true');
        } else {
            addLine('');
            addLine('/////////////// Actor Details ///////////////');
            addLine('Name: ' + token.actor.name);
            addLine('Type: ' + token.actor.type);
            addLine('Items: ' + token.actor.items.size);
            addLine('Invalid Items: ' + token.actor.items.invalidDocumentIds.size);
            let total = 0;
            token.actor.items.forEach(i => {
                total += i.effects.invalidDocumentIds.size;
            });
            addLine('Items With Invalid Effects: ' + total);
            addLine('Effects: ' + token.actor.effects.size);
            addLine('Invalid Effects: ' + token.actor.effects.invalidDocumentIds.size);
            addLine('Uuid: ' + token.actor.uuid);
        }
    }
    let otherAdded = false;
    if (game.modules.get('plutonium') || game.modules.get('plutonium-addon-automation')) {
        addLine('');
        addLine('/////////////// Other ///////////////');
        otherAdded = true;
        if (!game.modules.get('plutonium')?.active) {
            addLine('Unsupported Importer: false');
        } else {
            addLine('Unsupported Importer: true');
        }
    }
    if (globalThis.localforage) {
        if (!otherAdded) {
            addLine('');
            addLine('/////////////// Other ///////////////');
        }
        addLine('localForage: true');
    }
    async function troubleshooterDialog() {
        async function save(output) {
            // eslint-disable-next-line no-undef
            saveDataToFile(output, 'text/txt', 'CPR-Troubleshoot.txt');
        }
        async function clipboard(output) {
            try {
                game.clipboard.copyPlainText(output);
                genericUtils.notify('CHRISPREMADES.Troubleshooter.Clipboard', 'info', {localize: true});
            } catch (error) {
                console.error(error);
            }
        }
        async function discord() {
            window.open('https://discord.gg/egH9AFtPJk');
        }
        let buttons = [
            {
                action: 'close',
                label: genericUtils.translate('CHRISPREMADES.Generic.Close'),
                type: 'submit',
                icon: 'fa-solid fa-xmark',
                default: true
            },
            {
                action: 'clipbaord',
                label: genericUtils.translate('CHRISPREMADES.Troubleshooter.CopyToClipboard'),
                type: 'button',
                icon: 'fa-solid fa-clipboard',
                callback: () => clipboard(output)
            },
            {
                action: 'save',
                label: genericUtils.translate('CHRISPREMADES.Troubleshooter.SaveToFile'),
                type: 'button',
                icon: 'fa-solid fa-floppy-disk',
                callback: () => save(output)
            },
            {
                action: 'discord',
                label: genericUtils.translate('CHRISPREMADES.Troubleshooter.Discord'),
                type: 'button',
                icon: 'fa-brands fa-discord',
                callback: () => discord()
            }
        ];
        let content = '<textarea rows="40" cols="1000" style="resize: none;">' + output + '</textarea>';
        let dialog = new foundry.applications.api.DialogV2({
            window: {
                title: genericUtils.translate('CHRISPREMADES.Troubleshooter.Title'),
            },
            classes: ['cpr-troubleshooter'],
            content: content,
            buttons: buttons,
            position: {
                height: 800,
                width: 1000
            }
        });
        await dialog.render({force: true});
    }
    return await troubleshooterDialog();
}
async function startup() {
    if (!socketUtils.isTheGM()) return;
    let requiredModules = new Set([]);
    game.modules.get('chris-premades').relationships.requires.forEach(value => {
        requiredModules.add(value.id);
        let module = game.modules.get(value.id);
        if (module) game.modules.get(value.id).relationships.requires.forEach(value => {
            requiredModules.add(value.id);
        });
    });
    if (!genericUtils.getCPRSetting('disableSettingsWarning')) {
        let midiSettings = game.settings.get('midi-qol', 'ConfigSettings');
        let doSettingsMessage = false;
        let content = genericUtils.translate('CHRISPREMADES.Troubleshooter.SettingsMessage');
        let midiAdded = false;
        let monksWallsAdded = false;
        let tokenMagicAdded = false;
        function addMidiMessage() {
            if (midiAdded) return;
            content += '<b>' + genericUtils.translate('CHRISPREMADES.Troubleshooter.MidiSettings') + '</b><ul>';
            midiAdded = true;
        }
        if (!game.settings.get('midi-qol', 'EnableWorkflow')) {
            doSettingsMessage = true;
            addMidiMessage();
            content += '<li>' + genericUtils.translate('CHRISPREMADES.Troubleshooter.EnableWorkflow') + '</li>';
        }
        if (midiSettings.autoCEEffects === 'cepri' || midiSettings.autoCEEffects === 'both') {
            doSettingsMessage = true;
            addMidiMessage();
            content += '<li>' + genericUtils.translate('CHRISPREMADES.Troubleshooter.ConvenientEffects') + '</li>';
        }
        if (!midiSettings.allowActorUseMacro) {
            doSettingsMessage = true;
            addMidiMessage();
            content += '<li>' + genericUtils.translate('CHRISPREMADES.Troubleshooter.ActorOnUseMacros') + '</li>';
        }
        if (!midiSettings.allowUseMacro) {
            doSettingsMessage = true;
            addMidiMessage();
            content += '<li>' + genericUtils.translate('CHRISPREMADES.Troubleshooter.ItemOnUseMacros') + '</li>';
        }
        if (!(midiSettings.autoRollDamage == 'always' || midiSettings.autoRollDamage == 'onHit')) {
            doSettingsMessage = true;
            addMidiMessage();
            content += '<li>' + genericUtils.translate('CHRISPREMADES.Troubleshooter.PlayerAutoRollDamage') + '</li>';
        }
        if (!(midiSettings.gmAutoDamage == 'always' || midiSettings.gmAutoDamage == 'onHit')) {
            doSettingsMessage = true;
            addMidiMessage();
            content += '<li>' + genericUtils.translate('CHRISPREMADES.Troubleshooter.GMAutoRollDamage') + '</li>';
        }
        if (midiSettings.confirmAttackDamage != 'none') {
            doSettingsMessage = true;
            addMidiMessage();
            content += '<li>' + genericUtils.translate('CHRISPREMADES.Troubleshooter.ConfirmAttackRoll') + '</li>';
        }
        if (!midiSettings.waitForDamageApplication) {
            doSettingsMessage = true;
            addMidiMessage();
            content += '<li>' + genericUtils.translate('CHRISPREMADES.Troubleshooter.WaitForDamageApplication') + '</li>';
        }
        if (!midiSettings.autoCompleteWorkflow) {
            doSettingsMessage = true;
            addMidiMessage();
            content += '<li>' + genericUtils.translate('CHRISPREMADES.Troubleshooter.AutoCompleteWorkflow') + '</li>';
        }
        if (midiAdded) content += '</ul>';
        if (game.modules.get('monks-wall-enhancement')?.active) {
            if (game.settings.get('monks-wall-enhancement', 'allow-one-way-doors')) {
                monksWallsAdded = true;
                if (midiAdded) content += '<br>';
                content += '<b>' + genericUtils.translate('CHRISPREMADES.Troubleshooter.MonksWalls') + '</b><ul>';
                content += '<li>' + genericUtils.translate('CHRISPREMADES.Troubleshooter.OneWayDoors') + '</li></ul>';
            }
        }
        function addTokenMagicMessage() {
            if (tokenMagicAdded) return;
            if (midiAdded || monksWallsAdded) content += '<br>';
            content += '<b>' + genericUtils.translate('CHRISPREMADES.Troubleshooter.TokenMagicFXSettings') + '</b><ul>';
            tokenMagicAdded = true;
        }
        if (game.modules.get('tokenmagic')?.active) {
            if (game.settings.get('tokenmagic', 'autoTemplateEnabled')) {
                doSettingsMessage = true;
                addTokenMagicMessage();
                content += '<li>' + genericUtils.translate('CHRISPREMADES.Troubleshooter.AutoTemplateEnabled') + '</li>';
            }
            if (game.settings.get('tokenmagic', 'defaultTemplateOnHover')) {
                doSettingsMessage = true;
                addTokenMagicMessage();
                content += '<li>' + genericUtils.translate('CHRISPREMADES.Troubleshooter.DefaultTemplateOnHover') + '</li>';
            }
            if (game.settings.get('tokenmagic', 'autohideTemplateElements')) {
                doSettingsMessage = true;
                addTokenMagicMessage();
                content += '<li>' + genericUtils.translate('CHRISPREMADES.Troubleshooter.AutohideTemplateElements') + '</li>';
            }
        }
        if (tokenMagicAdded) content += '</ul>';
        let message = game.messages.find(i => i.flags?.['chris-premades']?.button?.type === 'settings');
        if (message) await genericUtils.remove(message);
        if (doSettingsMessage) {
            content += genericUtils.translate('CHRISPREMADES.Troubleshooter.FixSettingsButton');
            message = await ChatMessage.create({
                speaker: {alias: genericUtils.translate('CHRISPREMADES.Generic.CPR')},
                content,
                flags: {
                    'chris-premades': {
                        button: {
                            type: 'settings'
                        }
                    }
                }
            });
        }
    }
    if (!genericUtils.getCPRSetting('disableModulesWarning')) {
        let incomptablemodulesFound = new Set();
        incompatibleModules.forEach(id => {
            if (game.modules.get(id)?.active) incomptablemodulesFound.add(id);
        });
        let defunctModulesFound = new Set();
        defunctModules.forEach(id => {
            if (id === 'dfreds-convenient-effects') return;
            if (game.modules.get(id)?.active) defunctModulesFound.add(id);
        });
        let content = '';
        if (incomptablemodulesFound.size) {
            content += genericUtils.translate('CHRISPREMADES.Troubleshooter.ModulesMessage') + '<ul>';
            let isFirst = true;
            incomptablemodulesFound.forEach(id => {
                if (!isFirst) content += '<br>';
                content += '<li>' + game.modules.get(id).title + '</li>';
                isFirst = false;
            });
            content += '</ul>';
        }
        if (defunctModulesFound.size) {
            if (incomptablemodulesFound.size) content += '<br>';
            content += genericUtils.translate('CHRISPREMADES.Troubleshooter.DefunctModulesMessage') + '<ul>';
            let isFirst = true;
            defunctModulesFound.forEach(id => {
                if (!isFirst) content += '<br>';
                content += '<li>' + game.modules.get(id).title + '</li>';
                isFirst = false;
            });
            content += '</ul>';
        }
        let jb2aFree = game.modules.get('JB2A_DnD5e')?.active;
        let jb2aPatreon = game.modules.get('jb2a_patreon')?.active;
        let jb2aIssue = false;
        if (!jb2aFree && !jb2aPatreon) {
            if (incomptablemodulesFound.size || defunctModulesFound.size) content += '<br>';
            content += '<hr>' + genericUtils.translate('CHRISPREMADES.Troubleshooter.MissingJB2A');
            jb2aIssue = true;
        } else if (jb2aFree && jb2aPatreon) {
            if (incomptablemodulesFound.size || defunctModulesFound.size) content += '<br>';
            content += '<hr>' + genericUtils.translate('CHRISPREMADES.Troubleshooter.BothJB2A');
            jb2aIssue = true;
        }
        if (incomptablemodulesFound.size || defunctModulesFound.size || jb2aIssue) {
            let moduleMessage = game.messages.find(i => i.flags?.['chris-premades']?.button?.type === 'moduleIssues');
            if (moduleMessage) await genericUtils.remove(moduleMessage);
            content += genericUtils.translate('CHRISPREMADES.Troubleshooter.ModuleIssuesButton');
            await ChatMessage.create({
                speaker: {alias: genericUtils.translate('CHRISPREMADES.Generic.CPR')},
                content,
                flags: {
                    'chris-premades': {
                        button: {
                            type: 'moduleIssues'
                        }
                    }
                }
            });
        }
    }
}
async function fixSettings(message) {
    await genericUtils.remove(message);
    await game.settings.set('midi-qol', 'EnableWorkflow', true);
    let midiSettings = genericUtils.duplicate((game.settings.get('midi-qol', 'ConfigSettings')));
    let newMidiSettings = {
        autoCEEffects: 'itempri',
        allowActorUseMacro: true,
        allowUseMacro: true,
        confirmAttackDamage: 'none',
        waitForDamageApplication: true,
        autoCompleteWorkflow: true
    };
    if (!['onHit', 'always'].includes(midiSettings.autoRollDamage)) newMidiSettings.autoRollDamage = 'onHit';
    if (!['onHit', 'always'].includes(midiSettings.gmAutoDamage)) newMidiSettings.gmAutoDamage = 'onHit';
    Object.entries(newMidiSettings).forEach(([key, value]) => genericUtils.setProperty(midiSettings, key, value));
    await game.settings.set('midi-qol', 'ConfigSettings', midiSettings);
    if (game.modules.get('monks-wall-enhancement')?.active) {
        await game.settings.set('monks-wall-enhancement', 'allow-one-way-doors', false);
    }
    if (game.modules.get('tokenmagic')?.active) {
        await game.settings.set('tokenmagic', 'autoTemplateEnabled', false);
        await game.settings.set('tokenmagic', 'defaultTemplateOnHover', false);
        await game.settings.set('tokenmagic', 'autohideTemplateElements', false);
    }
    genericUtils.notify('CHRISPREMADES.Troubleshooter.SettingsFixed', 'info', {localize: true});
}
async function ignoreSettingsWarning(message) {
    await genericUtils.remove(message);
    await genericUtils.setCPRSetting('disableSettingsWarning', true);
}
async function ignoreModuleIssues(message) {
    await genericUtils.remove(message);
    await genericUtils.setCPRSetting('disableModulesWarning', true);
}
export let troubleshooter = {
    run,
    startup,
    fixSettings,
    ignoreSettingsWarning,
    ignoreModuleIssues
};