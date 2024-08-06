import {backup} from '../extensions/backup.js';
import {conditions} from '../extensions/conditions.js';
import {sidebar} from '../extensions/sidebar.js';
import {genericUtils} from '../utils.js';
import {AdditionalCompendiums} from './additionalCompendiums.js';
import {DialogApp} from './dialog.js';
import {troubleshooter} from './troubleshooter.js';
let settingCategories = {};
let buttonLabels = {
    additionalCompendiums: 'CHRISPREMADES.Generic.Configure',
    statusEffectIcons: 'CHRISPREMADES.Generic.Configure',
    backupCompendium: 'CHRISPREMADES.Generic.Select',
    hiddenCompendiums: 'CHRISPREMADES.Generic.Select',
    hiddenCompendiumFolders: 'CHRISPREMADES.Generic.Select',
    backupMake: 'CHRISPREMADES.Generic.Go',
    trouble: 'CHRISPREMADES.Generic.Go',
    monsterCompendium: 'CHRISPREMADES.Generic.Select'
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
            classes: ['form'],
            popOut: true,
            template: 'modules/chris-premades/templates/settings.hbs',
            id: 'chris-premades-settings',
            title: 'Chris\'s Premades',
            width: 800,
            height: 'auto',
            closeOnSubmit: true
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
            s.name = genericUtils.translate('CHRISPREMADES.Settings.' + s.key + '.Name');
            s.hint = genericUtils.translate('CHRISPREMADES.Settings.' + s.key + '.Hint');
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
async function selectCompendium(settingKey, type) {
    let oldKey = genericUtils.getCPRSetting(settingKey);
    let compendiums = game.packs.filter(i => i.metadata.type === type);
    let inputs = compendiums.map(i => ({
        label: i.metadata.label,
        name: i.metadata.id,
        options: {isChecked: oldKey === i.metadata.id}
    }));
    let selection = await DialogApp.dialog('CHRISPREMADES.Settings.' + settingKey + '.Name', 'CHRISPREMADES.Settings.' + settingKey + '.Hint', [['radio', inputs, {displayAsRows: true}]], 'okCancel');
    if (!selection) return;
    await game.settings.set('chris-premades', settingKey, selection.radio);
}
export async function settingButton(id) {
    switch(id) {
        case 'additionalCompendiums': new AdditionalCompendiums().render(true); break;
        case 'statusEffectIcons': await conditions.configureStatusEffectIcons(); break;
        case 'backupCompendium': await backup.selectCompendium(); break;
        case 'hiddenCompendiums': await sidebar.selectHiddenCompendiums(); break;
        case 'hiddenCompendiumFolders': await sidebar.selectHiddenCompendiumFolders(); break;
        case 'backupMake': await backup.doBackup(true); break;
        case 'trouble': await troubleshooter(); break;
        case 'monsterCompendium': await selectCompendium('monsterCompendium', 'Actor');
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
export class settingsGeneral extends settingsBase {
    constructor() {
        super();
        this.category = 'general';
    }
}
export class settingsIntegration extends settingsBase {
    constructor() {
        super();
        this.category = 'integration';
    }
}
export class settingsBackup extends settingsBase {
    constructor() {
        super();
        this.category = 'backup';
    } 
}
export class settingsHelp extends FormApplication {
    constructor() {
        super();
    }
    static get defaultOptions() {
        return genericUtils.mergeObject(super.defaultOptions, {
            classes: ['form'],
            popOut: true,
            template: 'modules/chris-premades/templates/settings.hbs',
            id: 'chris-troubleshoot-settings',
            title: 'Help',
            width: 800,
            height: 'auto',
            closeOnSubmit: true
        });
    }
    getData() {
        return {
            settings: [
                /*{
                    name: 'Tour Features',
                    id: 'tour',
                    value: {},
                    isButton: true,
                    hint: 'Start a guided tour of Chris\'s Premades.',
                    label: 'Go'
                }, */
                {
                    name: genericUtils.translate('CHRISPREMADES.Troubleshooter.Open'),
                    id: 'trouble',
                    value: {},
                    isButton: true,
                    hint: genericUtils.translate('CHRISPREMADES.Troubleshooter.Hint'),
                    label: genericUtils.translate('CHRISPREMADES.Generic.Go')
                }
            ]
        };
    }
    activateListeners(html) {
        super.activateListeners(html);
    }
    _updateObject(event, formData) {}
}