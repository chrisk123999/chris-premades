import {troubleshoot} from './help.js';

let settingCategories = {};
export function addMenuSetting(key, category) {
    setProperty(settingCategories, key.split(' ').join('-'), category);
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
export class chrisSettingsTroubleshoot extends FormApplication {
    constructor() {
        super();
    }
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            'classes': ['form'],
            'popOut': true,
            'template': 'modules/chris-premades/templates/config.html',
            'id': 'chris-premades-settings',
            'title': 'Chris\'s Troubleshooter',
            'width': 800,
            'height': 'auto',
            'closeOnSubmit': true
        });
    }
    getData() {
        return {'settings':
            [
                {
                    'name': 'Run Troubleshooter?',
                    'id': 'trouble',
                    'value': false,
                    'isCheckbox': true,
                    'hint': 'Checking this box will export a file used to help troubleshoot issues with this module on my Discord server.'
                },
                {
                    'name': 'Apply reccomended setting fixes?',
                    'id': 'fix',
                    'value': false,
                    'isCheckbox': true,
                    'hint': 'Checking this will have the module automatically apply my reccomended setting changes.'
                }
            ]
        }
    }
    activateListeners(html) {
        super.activateListeners(html);
    }
    async _updateObject(event, formData) {
        console.log(formData);
        if (formData.trouble) troubleshoot();
        if (formData.fix) {
            
        }
    }
}