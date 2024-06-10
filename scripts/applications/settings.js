import {genericUtils} from '../utils.js';
import {AdditionalCompendiums} from './additionalCompendiums.js';
let settingCategories = {};
let buttonLabels = {
    additionalCompendiums: 'CHRISPREMADES.configure',
    compendiumPriority: 'CHRISPREMADES.configure'
};
function addMenuSetting(key, category) {
    genericUtils.setProperty(settingCategories, key.split(' ').join('-'), category);
}
export let settings = {
    addMenuSetting
};
class settingsBase extends FormApplication {
    constructor() {
        super();
        this.category = null;
    }
    static get defaultOptions() {
        return genericUtils.mergeObject(super.defaultOptions, {
            'classes': ['form'],
            'popOut': true,
            'template': 'modules/chris-premades/templates/settings.hbs',
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
            let s = genericUtils.deepClone(setting);
            if (s.scope === 'world' && !game.user.isGM) continue;
            s.id = String(s.key);
            s.name = genericUtils.translate('CHRISPREMADES.settings.' + s.key + '.name');
            s.hint = genericUtils.translate('CHRISPREMADES.settings.' + s.key + '.hint');
            s.value = game.settings.get(s.namespace, s.key);
            s.type = setting.type instanceof Function ? setting.type.name : 'String';
            s.isCheckbox = setting.type === Boolean;
            s.isSelect = s.choices !== undefined;
            s.isRange = (setting.type === Number) && s.range;
            s.isNumber = setting.type === Number;
            s.filePickerType = s.filePicker === true ? 'any' : s.filePicker;
            s.isButton = (setting.type instanceof Object || setting.type instanceof Array) && setting.type.name != 'String';
            if (s.select) s.isButton = true;
            s.label = genericUtils.translate(buttonLabels[key]);
            generatedOptions.push(s);
        }
        return {settings: generatedOptions.sort((a, b) => {
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
    async _updateObject(event, formData) {
        for (let [key, value] of Object.entries(formData)) {
            if (game.settings.get('chris-premades', key) === value) continue;
            await game.settings.set('chris-premades', key, value);
        }
    }
}
export async function settingButton(id) {
    switch(id) {
        case 'additionalCompendiums': 
            new AdditionalCompendiums().render(true);
            break;
    }
}
export class settingsDevelopment extends settingsBase {
    constructor() {
        super();
        this.category = 'development';
    }
}
export class settingsDialog extends settingsBase {
    constructor() {
        super();
        this.category = 'dialog';
    }
}
export class settingsInterface extends settingsBase {
    constructor() {
        super();
        this.category = 'interface';
    }
}
export class settingsCompendium extends settingsBase {
    constructor() {
        super();
        this.category = 'compendium';
    }
}
export class settingsMechanics extends settingsBase {
    constructor() {
        super();
        this.category = 'mechanics';
    }
}