import {backup} from '../extensions/backup.js';
import {conditions} from '../extensions/conditions.js';
import {sidebar} from '../extensions/sidebar.js';
import {genericUtils} from '../utils.js';
import {AdditionalCompendiums} from './additionalCompendiums.js';
import {DialogApp} from './dialog.js';
import {tours} from './tour.js';
import {troubleshooter} from './troubleshooter.js';
import {rollResolver} from '../extensions/rollResolver.js';
import {spellList} from '../extensions/spellList.js';
import {bg3} from '../macros/2014/homebrew/bg3WeaponActions.js';
let settingCategories = {};
let buttonLabels = {
    additionalCompendiums: 'CHRISPREMADES.Generic.Configure',
    statusEffectIcons: 'CHRISPREMADES.Generic.Configure',
    backupCompendium: 'CHRISPREMADES.Generic.Select',
    hiddenCompendiums: 'CHRISPREMADES.Generic.Select',
    hiddenCompendiumFolders: 'CHRISPREMADES.Generic.Select',
    backupMake: 'CHRISPREMADES.Generic.Go',
    trouble: 'CHRISPREMADES.Generic.Go',
    monsterCompendium: 'CHRISPREMADES.Generic.Select',
    spellCompendium: 'CHRISPREMADES.Generic.Select',
    macroCompendium: 'CHRISPREMADES.Generic.Select',
    manualRollsUsers: 'CHRISPREMADES.Generic.Configure',
    classSpellList: 'CHRISPREMADES.Generic.Select',
    itemCompendium: 'CHRISPREMADES.Generic.Select',
    bg3WeaponActionConfig: 'CHRISPREMADES.Generic.Configure',
    fumbleCompendium: 'CHRISPREMADES.Generic.Select',
    criticalCompendium: 'CHRISPREMADES.Generic.Select',
    makeGM: 'CHRISPREMADES.Generic.Go',
    rollTableCompendium: 'CHRISPREMADES.Generic.Select',
    featCompendium: 'CHRISPREMADES.Generic.Select'
};
function addMenuSetting(key, category) {
    genericUtils.setProperty(settingCategories, key.split(' ').join('-'), category);
}
export let settings = {
    addMenuSetting
};
export function getSettingsClass(category) {
    return class SettingsClass extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
        category = category;
        static DEFAULT_OPTIONS = {
            tag: 'form',
            id: 'chris-premades-settings',
            window: {
                title: 'Cauldron of Plentiful Resources',
                contentClasses: ['standard-form']
            },
            form: {
                closeOnSubmit: true,
                handler: this.#handleSubmit
            },
            position: {
                width: 800,
                height: 'auto'
            }
        };
        static PARTS = {
            form: {
                template: 'modules/chris-premades/templates/settings.hbs',
                scrollable: ['']
            },
            footer: {
                template: 'templates/generic/form-footer.hbs'
            }
        };
        async _prepareContext(options) {
            let context = await super._prepareContext(options);
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
            return genericUtils.mergeObject(context, {
                settings: generatedOptions.sort((a, b) => {
                    let nameA = a.name.toUpperCase();
                    let nameB = b.name.toUpperCase();
                    if (nameA > nameB) {
                        return 1;
                    } else if (nameA < nameB) {
                        return -1;
                    } else {
                        return 0;
                    }
                }),
                buttons: [{
                    label: genericUtils.translate('Confirm'),
                    type: 'submit',
                    icon: 'fa fa-check'
                }]
            });
        }
        static async #handleSubmit(event, form, formData) {
            for (let [key, value] of Object.entries(formData.object)) {
                if (game.settings.get('chris-premades', key) === value) continue;
                await game.settings.set('chris-premades', key, value);
            }
        }
    };
}
async function selectCompendium(settingKey, type) {
    let oldKey = genericUtils.getCPRSetting(settingKey);
    let compendiums = game.packs.filter(i => i.metadata.type === type);
    let inputs = compendiums.map(i => ({
        label: i.metadata.label,
        name: i.metadata.id,
        options: {isChecked: oldKey === i.metadata.id}
    }));
    let selection = await DialogApp.dialog('CHRISPREMADES.Settings.' + settingKey + '.Name', 'CHRISPREMADES.Settings.SelectCompendium', [['radio', inputs, {displayAsRows: true}]], 'okCancel', {id: 'cpr-select-monster-compendium'});
    if (!selection) return;
    await genericUtils.setCPRSetting(settingKey, selection.radio);
}
export async function settingButton(id) {
    switch(id) {
        case 'additionalCompendiums': new AdditionalCompendiums().render(true); break;
        case 'statusEffectIcons': await conditions.configureStatusEffectIcons(); break;
        case 'backupCompendium': await backup.selectCompendium(); break;
        case 'hiddenCompendiums': await sidebar.selectHiddenCompendiums(); break;
        case 'hiddenCompendiumFolders': await sidebar.selectHiddenCompendiumFolders(); break;
        case 'backupMake': await backup.doBackup(true); break;
        case 'trouble': await troubleshooter.run(); break;
        case 'monsterCompendium': await selectCompendium('monsterCompendium', 'Actor'); break;
        case 'spellCompendium': await selectCompendium('spellCompendium', 'Item'); break;
        case 'macroCompendium': await selectCompendium('macroCompendium', 'Macro'); break;
        case 'tour': {
            Object.values(ui.windows).find(i => i.id === 'chris-troubleshoot-settings')?.close();
            game.settings.sheet.close();
            tours.guidedTour();
            break;
        }
        case 'manualRollsUsers': await rollResolver.manualRollsUsersDialog(); break;
        case 'classSpellList': await spellList.selectJournal('classSpellList'); break;
        case 'itemCompendium': await selectCompendium('itemCompendium', 'Item'); break;
        case 'bg3WeaponActionConfig': await bg3.configure(); break;
        case 'fumbleCompendium': await selectCompendium('fumbleCompendium', 'Item'); break;
        case 'criticalCompendium': await selectCompendium('criticalCompendium', 'Item'); break;
        case 'makeGM': await genericUtils.setCPRSetting('makeGM', game.user.id); break;
        case 'rollTableCompendium': await selectCompendium('rollTableCompendium', 'RollTable'); break;
        case 'featCompendium': await selectCompendium('featCompendium', 'Item'); break;
    }
}
export class SettingsHelp extends getSettingsClass(null) {
    static DEFAULT_OPTIONS = {
        tag: 'form',
        id: 'chris-troubleshoot-settings',
        window: {
            title: 'Help',
            contentClasses: ['standard-form']
        },
        form: {
            closeOnSubmit: true,
            handler: () => {}
        },
        position: {
            width: 800,
            height: 'auto'
        }
    };
    async _prepareContext(options) {
        let context = await super._prepareContext(options);
        return genericUtils.mergeObject(context, {
            settings: [
                {
                    name: genericUtils.translate('CHRISPREMADES.Tour.TourFeatures'),
                    id: 'tour',
                    value: {},
                    isButton: true,
                    hint: genericUtils.translate('CHRISPREMADES.Tour.Hint'),
                    label: genericUtils.translate('CHRISPREMADES.Generic.Go')
                },
                {
                    name: genericUtils.translate('CHRISPREMADES.Troubleshooter.Open'),
                    id: 'trouble',
                    value: {},
                    isButton: true,
                    hint: genericUtils.translate('CHRISPREMADES.Troubleshooter.Hint'),
                    label: genericUtils.translate('CHRISPREMADES.Generic.Go')
                }
            ]
        });
    }
}