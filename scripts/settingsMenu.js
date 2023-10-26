import {updateAllSceneNPCs, updateSceneNPCs, updateSidebarNPCs} from './actor.js';
import {additionalCompendiumPriority, additionalCompendiums} from './compendium.js';
import {fixSettings, troubleshoot} from './help.js';
import {allRaces} from './utility/npcRandomizer.js';
let settingCategories = {};
export function addMenuSetting(key, category) {
    setProperty(settingCategories, key.split(' ').join('-'), category);
}
let labels = {
    'Humanoid-Randomizer-Settings': 'Configure',
    'Additional-Compendiums': 'Configure',
    'Additional-Compendium-Priority': 'Configure'
}
class chrisSettingsBase extends FormApplication {
    constructor() {
        super();
        this.category = null;
    }
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            'classes': ['form'],
            'popOut': true,
            'template': 'modules/chris-premades/templates/config.html',
            'id': 'chris-premades-settings',
            'title': 'Chris\'s Premades',
            'width': 800,
            'height': 'auto',
            'closeOnSubmit': true
        });
    }
    getData() {
        let generatedOptions = [];
	    for (let setting of game.settings.settings.values()) {
            if (setting.namespace != 'chris-premades') continue;
            let key = setting.key.split(' ').join('-');
            if (settingCategories[key] != this.category) continue;
            const s = foundry.utils.deepClone(setting);
            if (s.scope === 'world' && !game.user.isGM) continue;
            s.id = `${s.key}`;
            s.name = game.i18n.localize(s.name);
            s.hint = game.i18n.localize(s.hint);
            s.value = game.settings.get(s.namespace, s.key);
            s.type = setting.type instanceof Function ? setting.type.name : 'String';
            s.isCheckbox = setting.type === Boolean;
            s.isSelect = s.choices !== undefined;
            s.isRange = (setting.type === Number) && s.range;
            s.isNumber = setting.type === Number;
            s.filePickerType = s.filePicker === true ? 'any' : s.filePicker;
            s.isButton = (setting.type instanceof Object || setting.type instanceof Array) && setting.type.name != 'String';
            s.label = labels[key];
            generatedOptions.push(s);
	    }
        return {'settings': generatedOptions.sort(function (a, b) {
            let nameA = a.name.toUpperCase();
            let nameB = b.name.toUpperCase();
            if (nameA > nameB) {
                return 1;
            } else if (nameA < nameB) {
                return -1;
            } else {
                return 0;
            }
        })};
    }
    activateListeners(html) {
        super.activateListeners(html);
    }
    async _updateObject(event, formData) {
        for (let [key, value] of Object.entries(formData)) {
            if (game.settings.get('chris-premades', key) === value) continue;
            await game.settings.set('chris-premades', key, value);
        }
    }
}
export class chrisSettingsGeneral extends chrisSettingsBase {
    constructor() {
        super();
        this.category = 'General';
    }
}
export class chrisSettingsCompendiums extends chrisSettingsBase {
    constructor() {
        super();
        this.category = 'Compendiums';
    }
}
export class chrisSettingsMechanics extends chrisSettingsBase {
    constructor() {
        super();
        this.category = 'Mechanics';
    }
}
export class chrisSettingsSpells extends chrisSettingsBase {
    constructor() {
        super();
        this.category = 'Spells';
    }
}
export class chrisSettingsFeats extends chrisSettingsBase {
    constructor() {
        super();
        this.category = 'Feats';
    }
}
export class chrisSettingsClassFeats extends chrisSettingsBase {
    constructor() {
        super();
        this.category = 'Class Features';
    }
}
export class chrisSettingsRaceFeats extends chrisSettingsBase {
    constructor() {
        super();
        this.category = 'Race Features';
    }
}
export class chrisSettingsMonsterFeats extends chrisSettingsBase {
    constructor() {
        super();
        this.category = 'Monster Features';
    }
}
export class chrisSettingsSummons extends chrisSettingsBase {
    constructor() {
        super();
        this.category = 'Summons';
    }
}
export class chrisSettingsHomewbrew extends chrisSettingsBase {
    constructor() {
        super();
        this.category = 'Homebrew';
    }
}
export class chrisSettingsModule extends chrisSettingsBase {
    constructor() {
        super();
        this.category = 'Module Integration';
    }
}
export class chrisSettingsManualRolling extends chrisSettingsBase {
    constructor() {
        super();
        this.category = 'Manual Rolling';
    }
}
export class chrisSettingsRandomizer extends chrisSettingsBase {
    constructor() {
        super();
        this.category = 'Randomizer';
    }
}
export class chrisSettingsAnimations extends chrisSettingsBase {
    constructor() {
        super();
        this.category = 'Animations';
    }
}
export class chrisSettingsTroubleshoot extends FormApplication {
    constructor() {
        super();
    }
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            'classes': ['form'],
            'popOut': true,
            'template': 'modules/chris-premades/templates/config.html',
            'id': 'chris-troubleshoot-settings',
            'title': 'Chris\'s Troubleshooter',
            'width': 800,
            'height': 'auto',
            'closeOnSubmit': true
        });
    }
    getData() {
        return {
            'settings': [
                {
                    'name': 'Run Troubleshooter:',
                    'id': 'trouble',
                    'value': {},
                    'isButton': true,
                    'hint': 'Will export a file used to help troubleshoot issues with this module on my Discord server.',
                    'label': 'Go'
                },
                {
                    'name': 'Apply recommended setting fixes:',
                    'id': 'fix',
                    'value': {},
                    'isButton': true,
                    'hint': 'This will have the module automatically apply recommended setting changes.',
                    'label': 'Go'
                }
            ]
        }
    }
    activateListeners(html) {
        super.activateListeners(html);
    }
    async _updateObject(event, formData) {

    }
}
export class chrisSettingsRandomizerHumanoid extends FormApplication {
    constructor() {
        super();
    }
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            'classes': ['form'],
            'popOut': true,
            'template': 'modules/chris-premades/templates/config.html',
            'id': 'chris-humanoid-randomizer-settings',
            'title': 'Chris\'s Humanoid Randomizer Settings',
            'width': 800,
            'height': 'auto',
            'closeOnSubmit': true
        });
    }
    getData() {
        let generatedOptions = [];
        let humanoidSettings = game.settings.get('chris-premades', 'Humanoid Randomizer Settings');
        for (let i of Object.values(allRaces)) {
            let id = i.name.toLowerCase().split(' ').join('-');
            generatedOptions.push(
                {
                    'name': i.name + ' enabled:',
                    'id': id + '.enabled',
                    'value': humanoidSettings?.[id]?.enabled ?? allRaces[id].enabled,
                    'isCheckbox': true,
                    'hint': 'Enable use of the ' + i.name + ' race?'
                },
                {
                    'name': i.name + ' weight:',
                    'id': id + '.weight',
                    'value': humanoidSettings?.[id]?.weight ?? allRaces[id].weight,
                    'isRange': true,
                    'range': {
                        'min': 1,
                        'max': 100,
                        'step': 1
                    },
                    'hint': 'Weighted chance for ' + i.name + ' to be selected.'
                }
            );
        }
        return {'settings': generatedOptions};
    }
    activateListeners(html) {
        super.activateListeners(html);
    }
    async _updateObject(event, formData) {
        let updates = {};
        for (let [key, value] of Object.entries(formData)) {
            setProperty(updates, key, value);
        }
        let setting = mergeObject(allRaces, game.settings.get('chris-premades', 'Humanoid Randomizer Settings'));
        mergeObject(setting, updates);
        game.settings.set('chris-premades', 'Humanoid Randomizer Settings', setting);
    }
}
export async function settingButton(id) {
    switch (id) {
        case 'Humanoid Randomizer Settings':
            await new chrisSettingsRandomizerHumanoid().render(true);
            break;
        case 'trouble':
            try {
                troubleshoot();
            } catch {}
            break;
        case 'fix':
            fixSettings();
            break;
        case 'sidebarNPCs':
            await updateSidebarNPCs();
            break;
        case 'sceneNPCs':
            await updateSceneNPCs();
            break;
        case 'allSceneNPCs':
            await updateAllSceneNPCs();
            break;
        case 'Additional Compendiums':
            await additionalCompendiums();
            break;
        case 'Additional Compendium Priority':
            await additionalCompendiumPriority();
            break;
    }
}
export class chrisSettingsNPCUpdate extends FormApplication {
    constructor() {
        super();
    }
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            'classes': ['form'],
            'popOut': true,
            'template': 'modules/chris-premades/templates/config.html',
            'id': 'chris-npc-updater',
            'title': 'Chris\'s NPC Updater',
            'width': 800,
            'height': 'auto',
            'closeOnSubmit': true
        });
    }
    getData() {
        return {
            'settings': [
                {
                    'name': 'Update Sidebar NPCs:',
                    'id': 'sidebarNPCs',
                    'value': {},
                    'isButton': true,
                    'hint': 'This will use the D&D Beyond Importer API to update all sidebar NPCs with automations from this module. Use with care!',
                    'label': 'Go'
                },
                {
                    'name': 'Update Current Scene NPCs:',
                    'id': 'sceneNPCs',
                    'value': {},
                    'isButton': true,
                    'hint': 'This will use the D&D Beyond Importer API to update the NPCs on the current scene with automations from this module. Use with care!',
                    'label': 'Go'
                },
                {
                    'name': 'Update All Scene NPCs',
                    'id': 'allSceneNPCs',
                    'value': {},
                    'isButton': true,
                    'hint': 'This will use the D&D Beyond Importer API to update all NPCs on all scenes with automations from this module. Use with care!',
                    'label': 'Go'
                }
            ]
        }
    }
    activateListeners(html) {
        super.activateListeners(html);
    }
    async _updateObject(event, formData) {

    }
}