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
    'JB2A_DnD5e': 'Jules&Ben\'s Animated Assets (F)',
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
    'dice-so-nice': 'Dice So Nice!'
}
let optionalModules = [
    'ATL',
    'about-time',
    'custom-character-sheet-sections',
    'compendium-folders',
    'ddb-importer',
    'foundryvtt-simple-calendar',
    'fxmaster',
    'itemacro',
    'JB2A_DnD5e',
    'jb2a_patreon',
    'quick-insert',
    'smalltime',
    'tidy5e-sheet',
    'times-up',
    'visual-active-effects',
    'foundryvtt-dice-so-nice'
];
let incompatibleModules = [
    'ready-set-roll-5e',
    'betterrolls5e',
    'rollgroups',
    'faster-rolling-by-default-5e',
    'quick-rolls',
    'dice-tooltip',
    'gm-paranoia-taragnor',
    'wire',
    'mre-dnd5e',
    'retroactive-advantage-5e',
    'max-crit',
    'multiattack-5e',
    'effective-transferral',
    'attack-roll-check-5e',
    'advancedspelleffects',
    'obsidian',
    'heartbeat',
    'dice-rng-protector',
    'concentrationnotifier'
]
export function troubleshoot() {
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
    addLine('/////////////// Incompatible Modules ///////////////');
    incompatibleModules.forEach(id => {
        if (game.modules.get(id)) addLine(checkModule(id));
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
    if (game.modules.get('plutonium') || game.modules.get('plutonium-addon-automation')) {
        addLine('');
        addLine('/////////////// Other ///////////////');
        if (!game.modules.get('plutonium')?.active) {
            addLine('Unsupported Importer: true (Disabled)');
        } else addLine('Unsupported Importer: true');
    }
    try {
        let filename = 'CPR-Troubleshoot.txt';
        let blob = new Blob([output], {
            'type': 'text/plain;charset=utf-8'
        });
        saveAs(blob, filename);
    } catch (error) {};
}
export async function fixSettings() {
    let changedSettings = [];
    if (game.modules.get('itemacro')?.active) {
        if (game.settings.get('itemacro', 'charsheet')) {
            await game.settings.set('itemacro', 'charsheet', false);
            changedSettings.push('IM-CharSheet');
        }
    }
    if (game.modules.get('midi-qol')?.active) {
        if (!game.settings.get('midi-qol', 'EnableWorkflow')) {
            await game.settings.set('midi-qol', 'EnableWorkflow', true);
            changedSettings.push('MQ-EnableWorkflow');
        }
        let updateMidiSettings = false;
        let midiSettings = duplicate(game.settings.get('midi-qol', 'ConfigSettings'));
        if (midiSettings.autoCEEffects != 'itempri') {
            midiSettings.autoCEEffects = 'itempri';
            changedSettings.push('MQ-autoCEEffects');
            updateMidiSettings = true;
        }
        if (midiSettings.attackPerTarget === true) {
            midiSettings.attackPerTarget = false;
            changedSettings.push('MQ-attackPerTarget');
            updateMidiSettings = true;
        }
        if (midiSettings.mergeCard === false) {
            midiSettings.mergeCard = true;
            changedSettings.push('MQ-mergeCard');
            updateMidiSettings = true;
        }
        if (updateMidiSettings) await game.settings.set('midi-qol', 'ConfigSettings', midiSettings);
    }
    if (changedSettings.length === 0) {
        ChatMessage.create({
            'speaker': {alias: name},
            'whisper': [game.user.id],
            'content': '<hr><b>Updated Settings:</b><br><hr>Nothing!'
        });
        return;
    }
    let list = '';
    if (changedSettings.includes('IM-CharSheet')) {
        list += '- Item Macro: Character Sheet Hook: false<br>';
    }
    if (changedSettings.includes('MQ-EnableWorkflow')) list += '- Midi-Qol: Roll Automation Support: true<br>';
    if (changedSettings.includes('MQ-autoCEEffects')) list += '- Midi-Qol: Apply Convenient Effects: Prefer Item Effect<br>';
    if (changedSettings.includes('MQ-attackPerTarget')) list += '- Midi-Qol: Roll Seperate Attack Per Target: false<br>';
    if (changedSettings.includes('MQ-mergeCard')) list += '- Midi-Qol: Merge Card: true<br>';
    ChatMessage.create({
        'speaker': {alias: name},
        'whisper': [game.user.id],
        'content': '<hr><b>Updated Settings:</b><br><hr>' + list
    });
}