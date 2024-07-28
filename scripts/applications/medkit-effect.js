let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {compendiumUtils, effectUtils, genericUtils, constants} from '../utils.js';
import * as macros from '../macros.js'; // Maybe see if the added macro exsists? Too much for 4am brain
export class EffectMedkit extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(context, effectDocument) {
        super();
        this.windowTitle = 'Chris\'s Premades Configuration: ' + context.label;
        this.position.width = 650;
        this.effectDocument = effectDocument;
        this.context = context;
    }
    static DEFAULT_OPTIONS = {
        tag: 'form',
        form: {
            handler: EffectMedkit.formHandler,
            submitOnChange: false,
            closeOnSubmit: false,
            id: 'EffectMedkit-window'
        },
        actions: {
            add: EffectMedkit._add,
            confirm: EffectMedkit.confirm
        },
        window: {
            icon: 'fa-solid fa-kit-medical',
            resizable: true,
        }
    };
    static PARTS = {
        header: {
            template: 'modules/chris-premades/templates/medkit-header.hbs'
        },
        navigation: {
            template: 'modules/chris-premades/templates/medkit-navigation.hbs'
        },
        configure: {
            template: 'modules/chris-premades/templates/medkit-effect-configure.hbs',
            scrollable: ['']
        },
        overtime: {
            template: 'modules/chris-premades/templates/medkit-effect-over-time.hbs',
            scrollable: ['']
        },
        devTools: {
            template: 'modules/chris-premades/templates/medkit-effect-dev-tools.hbs',
            scrollable: ['']
        },
        footer: {
            template: 'modules/chris-premades/templates/form-footer.hbs'
        }
    };
    static async effect(effect) {
        let context = await EffectMedkit.createContext(effect);
        new EffectMedkit(context, effect).render(true);
    }
    static async createContext(effect) {
        let context = {
            label: effect.name,
            status: '', // Will indicate the label/color of medkit
            configure: {
                noAnimation: {
                    label: 'CHRISPREMADES.Medkit.Effect.NoAnimation.Label',
                    tooltip: 'CHRISPREMADES.Medkit.Effect.NoAnimation.Tooltip',
                    value: effect.flags['chris-premades']?.noAnimation ? true : false,
                },
                conditions: {
                    label: 'CHRISPREMADES.Medkit.Effect.Conditions.Label',
                    tooltip: 'CHRISPREMADES.Medkit.Effect.Conditions.Tooltip',
                    value: effect.flags['chris-premades']?.conditions ?? [],
                    options: CONFIG.statusEffects.map(i => ({label: i.name, value: i.id, isSelected: effect.flags['chris-premades']?.conditions?.includes(i.id) ? true : false}))
                },
            },
            overTime: {
                original: effect?.changes?.find(i => i.key === 'flags.midi-qol.OverTime')?.value,
                show: effect?.changes?.find(i => i.key === 'flags.midi-qol.OverTime')?.value ? true : false
            },
            macros: {
                effect: JSON?.stringify(effect.flags['chris-premades']?.macros?.effect) ?? '',
                aura: JSON?.stringify(effect.flags['chris-premades']?.macros?.aura) ?? ''
            },
            isDev: game.settings.get('chris-premades', 'devTools')
        };
        // Figure out coloring for medkit
        //if (context.item.status === -1) context.item.status = context.item.availableAutomations.length > 0;
        //if (context.item.status === 1 | context.item.status === 0) context.item.hasAutomation = true;
        //context.item.statusLabel = 'CHRISPREMADES.Medkit.Status.' + context.item.status;
        context.medkitColor = '';
        switch (context.status) {
            case 1: //something
        }
        // Options for Over Time creator
        let overTimeOptions = constants.overTimeOptions;
        if (context.overTime.original) {
            let values = context.overTime.original.split(',').map(pair => pair.split('=').map(value => value.trim()));
            values.forEach(([key, value]) => genericUtils.setProperty(overTimeOptions.find(i => i.key === key) ?? {}, 'value', value));
        }
        overTimeOptions.forEach(i => genericUtils.setProperty(i, 'show', i.requires ? overTimeOptions.find(j => (j.key === i.requires) && j.value) ? true : false : true));
        let fieldsets = {};
        overTimeOptions.forEach(i => {
            if (!fieldsets[i.fieldset]) genericUtils.setProperty(fieldsets, i.fieldset, {
                label: 'CHRISPREMADES.Medkit.Fieldsets.' + i.fieldset + '.Label',
                tooltip: 'CHRISPREMADES.Medkit.Fieldsets.' + i.fieldset + '.Tooltip',
                options: []
            });
            switch (i.type) {
                case 'radio': {
                    genericUtils.setProperty(i, 'isRadio', true);
                    if (!i.value && (i.value != false)) genericUtils.setProperty(i, 'value', i.default);
                    i.options.forEach(j => genericUtils.setProperty(j, 'isChecked', j.value === i.value ? true : false));
                    break;
                }
                case 'text': {
                    genericUtils.setProperty(i, 'isText', true);
                    if (!i.value) genericUtils.setProperty(i, 'value', i.default ?? '');
                    break;
                }
                case 'boolean': {
                    genericUtils.setProperty(i, 'isCheckbox', true);
                    if (!i.value && (i.value != false)) genericUtils.setProperty(i, 'value', i.default);
                    genericUtils.setProperty(i, 'isChecked', i.value);
                    break;
                }
                case 'select': {
                    genericUtils.setProperty(i, 'isSelectOption', true);
                    if (!i.value) genericUtils.setProperty(i, 'value', i.default);
                    i.options.forEach(j => genericUtils.setProperty(j, 'isSelected', j.value === i.value ? true : false));
                    break;
                }
                case 'abilityOrSkill': {
                    genericUtils.setProperty(i, 'isSelectOption', true);
                    if (!i.value) genericUtils.setProperty(i, 'value', i.default);
                    genericUtils.setProperty(i, 'optgroups', [
                        {
                            label: 'CHRISPREMADES.Generic.Abilities',
                            options: Object.values(CONFIG.DND5E.abilities).map(j => ({
                                label: j.label,
                                value: j.abbreviation,
                                isSelected: j.abbreviation === i.value
                            }))
                        },
                        {
                            label: 'CHRISPREMADES.Generic.Skills',
                            options: Object.entries(CONFIG.DND5E.skills).map(([key, value]) => ({
                                label: value.label,
                                value: key,
                                isSelected: key === i.value
                            }))
                        }
                    ]);
                    break;
                }
                case 'ability': {
                    genericUtils.setProperty(i, 'isSelectOption', true);
                    if (!i.value) genericUtils.setProperty(i, 'value', i.default);
                    genericUtils.setProperty(i, 'options', 
                        Object.values(CONFIG.DND5E.abilities).map(j => ({
                            label: j.label,
                            value: j.abbreviation,
                            isSelected: j.abbreviation === i.value
                        }))
                    );
                    break;
                }
                case 'saves': {
                    genericUtils.setProperty(i, 'isSelectOption', true);
                    if (!i.value) genericUtils.setProperty(i, 'value', i.default);
                    genericUtils.setProperty(i, 'options', [
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.Spellcasting',
                            value: '@attributes.spelldc',
                            isSelected: i.value === '@attributes.spelldc'
                        },
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.Item',
                            value: '@item.save.dc',
                            isSelected: i.value === '@item.save.dc'
                        },
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.Flat',
                            value: 'flat', // Need to see if the actual value is a number
                            isSelected: i.value === 'flat' // Make it add another box if this is true
                        },
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.OverTime.Labels.Ability',
                            value: 'ability', // Need to see if the actual value is a ability
                            isSelected: i.value === 'ability'
                        }
                    ]);
                    if (Number(i.value)) {
                        let currentValue = genericUtils.duplicate(i.value);
                        genericUtils.setProperty(fieldsets[i.fieldset].options.find(k => k.key === 'saveDCNumber'), 'show', true),
                        genericUtils.setProperty(fieldsets[i.fieldset].options.find(k => k.key === 'saveDCNumber'), 'value', currentValue),
                        i.value = 'flat';
                        i.options.find(j => j.value === 'flat').isSelected = true;
                    } else if ((i.key === 'saveDC') && (Object.values(CONFIG.DND5E.abilities).map(j => j.abbreviation).includes(i.value))) {
                        let currentValue = genericUtils.duplicate(i.value);
                        genericUtils.setProperty(fieldsets[i.fieldset].options.find(k => k.key === 'saveDCAbility'), 'show', true),
                        genericUtils.setProperty(fieldsets[i.fieldset].options.find(k => k.key === 'saveDCAbility'), 'value', currentValue),
                        i.value = 'ability';
                        i.options.find(j => j.value === 'ability').isSelected = true;
                    }
                    break;
                }
                case 'damageTypes': {
                    genericUtils.setProperty(i, 'isSelectOption', true);
                    if (!i.value) genericUtils.setProperty(i, 'value', i.default);
                    genericUtils.setProperty(i, 'options', Object.entries(CONFIG.DND5E.damageTypes).map(([key, value]) => ({
                        label: value.label,
                        value: key,
                        isSelected: key === i.value
                    })));
                    break;
                }
            }
            fieldsets[i.fieldset].options.push(i);
        });
        genericUtils.setProperty(context.overTime, 'fieldsets', fieldsets);
        return context;
    }
    // Allows the overTime fields to be shown
    static async _add(event, target) {
        for (let key of Object.keys(this.tabsData)) {
            this.tabsData[key].cssClass = '';
        }
        let currentTabId = this.element.querySelector('.item.active').getAttribute('data-tab');
        this.tabsData[currentTabId].cssClass = 'active';
        this.context.overTime.show = true;
        this.render(true);
    }
    // Saves the context data to the effect
    static async confirm(event, target) {
        let effectData = genericUtils.duplicate(this.effectDocument.toObject());
        if (this.context.overTime.show) {
            let overTimeValue = '';
            Object.values(this.context.overTime.fieldsets).flatMap(i => i.options).forEach(i => {
                if (i.value && (i.value != '')) overTimeValue += i.key + '=' + i.value + ','; 
            });
            if (effectData.changes.find(i => i.key === 'flags.midi-qol.OverTime')) {
                effectData.changes.find(i => i.key === 'flags.midi-qol.OverTime').value = overTimeValue;
            } else {
                effectData.changes.push({
                    key: 'flags.midi-qol.OverTime',
                    value: overTimeValue,
                    mode: 0,
                    priority: 20
                });
            }
        } // Need flat DC and ability DC to be changed into the save DC value
        let effectUpdates = {flags: {'chris-premades': {}}};
        if (this.context.configure.noAnimation.value) genericUtils.setProperty(effectUpdates, 'noAnimation', this.context.configure.noAnimation.value);
        if (this.context.configure.conditions.value) genericUtils.setProperty(effectUpdates, 'conditions', this.context.configure.conditions.value);
        if (this.context.macros.effect.value && (this.context.macros.effect.value != '')) genericUtils.setProperty(effectUpdates, 'macros.effect', JSON.parse(this.context.macros.effect.replace(/'/g, '"')));
        if (this.context.macros.aura.value && (this.context.macros.aura.value != '')) genericUtils.setProperty(effectUpdates, 'macros.aura', JSON.parse(this.context.macros.aura.replace(/'/g, '"')));
        genericUtils.mergeObject(effectData, effectUpdates);
        let updates = {
            'effects': [effectData]
        };
        await this.effectDocument.parent.update(updates);
        this.effectDocument.sheet.render(true);
        this.close();
    }
    get title() {
        return this.windowTitle;
    }
    async _prepareContext(options) {
        let context = this.context;
        if (!this?.tabsData) {
            let tabsData = {
                configure: {
                    icon: 'fa-solid fa-wrench',
                    label: 'CHRISPREMADES.Medkit.Tabs.Configuration.Label',
                    tooltip: 'CHRISPREMADES.Medkit.Tabs.Configuration.Tooltip',
                    cssClass: 'active'
                },
                overtime: {
                    icon: 'fa-solid fa-stopwatch',
                    label: 'CHRISPREMADES.Medkit.Tabs.Overtime.Label',
                    tooltip: 'CHRISPREMADES.Medkit.Tabs.Overtime.Tooltip',
                    cssClass: ''
                }
            };
            if (game.settings.get('chris-premades', 'devTools')) {
                genericUtils.setProperty(tabsData, 'devTools', {
                    icon: 'fa-solid fa-wand-magic-sparkles',
                    label: 'Dev Tools',
                    tooltip: 'Tools for development, you shouldn\'t be here...',
                    cssClass: ''
                });
            }
            this.tabsData = tabsData;
        }
        context.tabs = this.tabsData;
        context.buttons = [
            {type: 'submit', action: 'confirm', label: 'CHRISPREMADES.Generic.Confirm', name: 'confirm', icon: 'fa-solid fa-check'}
        ];
        return context;
    }
    // Handles changes to the form, checkbox marks etc, updates the context store and forces a re-render
    async _onChangeForm(formConfig, event) {
        // Keep tabs data up to date with what's displayed
        for (let key of Object.keys(this.tabsData)) {
            this.tabsData[key].cssClass = '';
        }
        let currentTabId = this.element.querySelector('.item.active').getAttribute('data-tab');
        this.tabsData[currentTabId].cssClass = 'active';
        // Update context data
        switch (currentTabId) {
            case 'configure': {
                switch (event.target.type) {
                    case 'checkbox': {
                        this.context.configure[event.target.id].value = event.target.checked;
                        break;
                    }
                    default: {
                        this.context.configure.conditions.options.forEach(i => event.target.value.includes(i.value) ? i.isSelected = true : i.isSelected = false);
                        this.context.configure.conditions.value = event.target.value;
                    }
                }
                break;
            }
            case 'overtime': {
                switch (event.target.type) {
                    case 'radio': {
                        let option = this.context.overTime.fieldsets[event.target.getAttribute('data-fieldset')].options.find(i => i.key === event.target.name);
                        option.value = event.target.id;
                        option.options.forEach(i => i.isChecked = false);
                        option.options.find(i => i.value === event.target.id).isChecked = true;
                        break;
                    }
                    case 'text': {
                        this.context.overTime.fieldsets[event.target.getAttribute('data-fieldset')].options.find(i => i.key === event.target.id).value = event.target.value;
                        break;
                    }
                    case 'select-one': {
                        let option = this.context.overTime.fieldsets[event.target.getAttribute('data-fieldset')].options.find(i => i.key === event.target.id);
                        option.value = event.target.value;
                        (option?.options ?? option.optgroups.flatMap(i => i.options)).forEach(i => i.isSelected = false);
                        (option?.options ?? option.optgroups.flatMap(i => i.options)).find(i => i.value === event.target.value).isSelected = true;
                        break;
                    }
                    case 'checkbox': {
                        let option = this.context.overTime.fieldsets[event.target.getAttribute('data-fieldset')].options.find(i => i.key === event.target.id);
                        option.value = event.target.checked;
                        option.isChecked = event.target.checked;
                        break;
                    }
                }
                if (event.target.type === undefined && event.target.id === 'saveAbility') {
                    let option = this.context.overTime.fieldsets.rolls.options.find(i => i.key === 'saveAbility');
                    option.optgroups.flatMap(i => i.options).forEach(i => i.isSelected = event.target.value.includes(i.value) ? true : false);
                    option.value = event.target.value;
                }
                Object.values(this.context.overTime.fieldsets).forEach(i => {
                    i.options.forEach(j => {
                        if (j.requires != 'other') genericUtils.setProperty(j, 'show', j.requires ? constants.overTimeOptions.find(k => (k.key === j.requires) && k.value) ? true : false : true);
                    });
                });
                if (event.target.id === 'actionSave') {
                    if (event.target.checked === true) {
                        this.context.overTime.fieldsets.rolls.options.find(i => i.key === 'saveAbility').isSelectOption = false;
                        genericUtils.setProperty(this.context.overTime.fieldsets.rolls.options.find(i => i.key === 'saveAbility'), 'isSelectMultiple', true);
                    } else {
                        this.context.overTime.fieldsets.rolls.options.find(i => i.key === 'saveAbility').isSelectOption = true;
                        genericUtils.setProperty(this.context.overTime.fieldsets.rolls.options.find(i => i.key === 'saveAbility'), 'isSelectMultiple', false);
                    }
                } else if (event.target.id === 'saveDC') {
                    genericUtils.setProperty(this.context.overTime.fieldsets.rolls.options.find(i => i.key === 'saveDCNumber'), 'show', false);
                    genericUtils.setProperty(this.context.overTime.fieldsets.rolls.options.find(i => i.key === 'saveDCAbility'), 'show', false);
                    switch (this.context.overTime.fieldsets.rolls.options.find(i => i.key === 'saveDC').value) {
                        case 'flat': {
                            genericUtils.setProperty(this.context.overTime.fieldsets.rolls.options.find(i => i.key === 'saveDCNumber'), 'show', true);
                            break;
                        } 
                        case 'ability': {
                            genericUtils.setProperty(this.context.overTime.fieldsets.rolls.options.find(i => i.key === 'saveDCAbility'), 'show', true);
                            break;
                        }
                    }
                }
                break;
            }
            case 'devTools': {
                let value;
                try {
                    value = JSON.parse(event.target.value.replace(/'/g, '"'));
                } catch (error) {
                    ui.notifications.error('Error with Midi Item field, see console');
                    console.error(error);
                }
                if (value) this.context.macros[event.target.id] = event.target.value;
            }
        }
        this.render(true);
    }
}