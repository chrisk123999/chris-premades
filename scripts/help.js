let names = {
    'about-time': 'About Time',
    'ATL': 'Advanced Token Effects',
    'autoanimations': 'Automated Animations',
    'babonus': 'Build A Bonus',
    'compendium-folders': 'Compendium Folders',
    'custom-character-sheet-sections': 'Custom Character Sheet Sections',
    'dae': 'Dynamic Active Effects',
    'ddb-importer': 'D&D Beyond Importer',
    'dfreds-convenient-effects': 'DFreds Convenient Effects',
    'effectmacro': 'Effect Macro',
    'foundryvtt-simple-calendar': 'Simple Calendar',
    'fxmaster': 'FXMaster',
    'itemacro': 'Item Macro',
    'jb2a_patreon': 'Jules&Ben\'s Animated Assets (P)',
    'jb2a_dnd5e': 'Jules&Ben\'s Animated Assets (F)',
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
    'warpgate': 'Warpgate'
}
let optionalModules = [
    'about-time',
    'ATL',
    'custom-character-sheet-sections',
    'ddb-importer',
    'foundryvtt-simple-calendar',
    'fxmaster',
    'jb2a_patreon',
    'jb2a_dnd5e',
    'quick-insert',
    'smalltime',
    'tidy5e-sheet',
    'times-up',
    'visual-active-effects'
];
export function troubleshoot() {
    let output = '';
    function addLine(text) {
        output += '\n' + text;
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
    addLine('/////////////// Optional Modules ///////////////');
    optionalModules.forEach(id => {
        addLine(checkModule(id));
    });
    addLine('');
    addLine('/////////////// CPR Settings ///////////////');
    let cprSettings = Array.from(game.settings.settings).filter(i => i[0].includes('chris-premades') && i[1].namespace === 'chris-premades');
    cprSettings.forEach(i => {
        addLine(i[1].name + ': ' + game.settings.get('chris-premades', i[1].key));
    });
    if (game.modules.get('itemacro')?.active) {
        addLine('');
        addLine('/////////////// Item Macro Settings ///////////////');
        addLine('Character Sheet Hook: ' + game.settings.get('itemacro', 'charsheet'));
    }
    if (game.modules.get('midi-qol')?.active) {
        addLine('');
        addLine('/////////////// Midi-Qol Settings ///////////////');
        addLine('Roll Automation Support: ' + game.settings.get('midi-qol', 'EnableWorkflow'));
        let midiSettings = game.settings.get('midi-qol', 'ConfigSettings');
        switch(midiSettings.autoCEEffects) {
            case 'none':
                addLine('Apply Convenient Effects: None')
                break;
            case 'itempri':
                addLine('Apply Convenient Effects: Items > CE')
                break;
            case 'cepri':
                addLine('Apply Convenient Effects: CE > Items')
                break;
            case 'both':
                addLine('Apply Convenient Effects: Both')
                break;
        }
        addLine('Roll Seperate Attack Per Target: ' + midiSettings.attackPerTarget);
        addLine('Merge Card: ' + midiSettings.mergeCard);

    }
    if (game.modules.get('warpgate')?.active) {
        addLine('');
        addLine('/////////////// Warpgate User Permissions ///////////////');
        addLine('Create Tokens: ' + game.permissions.TOKEN_CREATE.includes(1));
        addLine('Configure Tokens: ' + game.permissions.TOKEN_CONFIGURE.includes(1));
        addLine('Browse Files: ' + game.permissions.FILES_BROWSE.includes(1));
    }
    let filename = 'CPR-Troubleshoot.txt';
    let blob = new Blob([output], {
        'type': 'text/plain;charset=utf-8'
    });
    saveAs(blob, filename);
}