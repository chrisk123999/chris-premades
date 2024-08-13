import {genericUtils} from '../utils.js';
let names = {
    'ATL': 'Advanced Token Effects',
    'JB2A_DnD5e': 'Jules&Ben\'s Animated Assets (F)',
    'about-time': 'About Time',
    'animated-spell-effects-cartoon': 'Animated Spell Effects: Cartoon',
    'autoanimations': 'Automated Animations',
    'babonus': 'Build A Bonus',
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
    'bugs': 'Bugbear\'s Scripts'
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
    'midi-item-showcase-community'
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
    'wire'
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
    'bugs'
];
export async function troubleshooter() {
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
        addLine('Chris\'s Premades: Development');
    } else {
        addLine('Chris\'s Premades: ' + game.modules.get('chris-premades').version);
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
    if (game.modules.get('midi-qol')?.active) {
        addLine('');
        addLine('/////////////// Midi-Qol Settings ///////////////');
        addLine('Roll Automation Support: ' + game.settings.get('midi-qol', 'EnableWorkflow'));
        let midiSettings = game.settings.get('midi-qol', 'ConfigSettings');
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
        addLine('Merge Card: ' + midiSettings.mergeCard);
        addLine('Actor On Use: ' + midiSettings.allowActorUseMacro);
        addLine('Item On Use: ' + midiSettings.allowUseMacro);
        addLine('Auto Roll Damage: ' + midiSettings.autoRollDamage);
    }
    if (game.modules.get('plutonium') || game.modules.get('plutonium-addon-automation')) {
        addLine('');
        addLine('/////////////// Other ///////////////');
        if (!game.modules.get('plutonium')?.active) {
            addLine('Unsupported Importer: false');
        } else {
            addLine('Unsupported Importer: true');
        }
    }
    async function troubleshooterDialog() {
        async function save(output) {
            // eslint-disable-next-line no-undef
            saveDataToFile(output, 'text/txt', 'CPR-Troubleshoot.txt');
        }
        async function clipboard(output) {
            try {
                navigator.clipboard.writeText(output);
                genericUtils.notify('CHRISPREMADES.Troubleshooter.Clipboard', 'info', {localize: true});
            } catch (error) {
                console.log(error);
            }
        }
        async function discord() {
            window.open('https://discord.gg/EhMdcMcUtU');
        }
        let buttons = {
            close: {
                label: genericUtils.translate('CHRISPREMADES.Generic.Close')
            },
            clipboard: {
                label: genericUtils.translate('CHRISPREMADES.Troubleshooter.CopyToClipboard'),
                callback: () => clipboard(output)
            },
            save: {
                label: genericUtils.translate('CHRISPREMADES.Troubleshooter.SaveToFile'),
                callback: () => save(output)
            },
            discord: {
                label: genericUtils.translate('CHRISPREMADES.Troubleshooter.Discord'),
                callback: () => discord()
            }
        };
        let content = '<textarea rows="40" cols="1000">' + output + '</textarea>';
        class TroubleDialog extends Dialog {
            _onClickButton(event) {
                let id = event.currentTarget.dataset.button;
                let button = this.data.buttons[id];
                if (button.cssClass === 'close') {
                    this.submit(button, event);
                    return;
                }
                button.callback();
            }
        }
        let dialog = new TroubleDialog(
            {
                title: genericUtils.translate('CHRISPREMADES.Troubleshooter.Title'),
                content: content,
                buttons: buttons
            },
            {
                height: 700,
                width: 1000
            }
        );
        await dialog._render(true);
    }
    return await troubleshooterDialog();
}
