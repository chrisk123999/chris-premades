let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {compendiumUtils, effectUtils, genericUtils, constants} from '../utils.js';
import * as macros from '../macros.js'; // Maybe see if the added macro exsists? Too much for 4am brain
export class EffectMedkit extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(context, effectDocument) {
        super();
        this.windowTitle = 'Chris\'s Premades Configuration: ' + context.label;
        this.position.width = 450;
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
            apply: EffectMedkit._apply,
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
            template: 'modules/chris-premades/templates/medkit-dev-tools.hbs',
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
                    options: CONFIG.statusEffects.map(i => ({label: i.name, value: i.id}))
                },
            },
            overTime: {
                original: effect?.changes?.find(i => i.key === 'flags.midi-qol.OverTime')?.value
            },
            macros: {
                effect: JSON?.stringify(effect.flags['chris-premades']?.macros?.effect) ?? ''
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
            let values = Object.fromEntries(context.overTime.original.split(',').map(pair => pair.split('=').map(value => value.trim())));
            values.forEach(([key, value]) => genericUtils.setProperty(overTimeOptions[overTimeOptions.findIndex(i => i.key === key)], 'value', value));
        }
        overTimeOptions.forEach(i => genericUtils.setProperty(i, 'show', i.requires ? overTimeOptions.find(j => (j.key === i.requires) && j.value) ? true : false : true));
        let fieldsets = {};
        overTimeOptions.forEach(i => {
            if (!fieldsets[i.fieldset]) genericUtils.setProperty(fieldsets, i.fieldset, {
                label: 'CHRISPREMADES.Medkit.Fieldsets.' + i.fieldset + '.label',
                tooltip: 'CHRISPREMADES.Medkit.Fieldsets.' + i.fieldset + '.tooltip',
                options: []
            });
            switch (i.type) { // add checked or selected per option
                case 'radio': {
                    genericUtils.setProperty(i, 'isRadio', true);
                    break;
                }
                case 'text': {
                    genericUtils.setProperty(i, 'isText', true);
                    break;
                }
                case 'boolean': {
                    genericUtils.setProperty(i, 'isCheckbox', true);
                    break;
                }
                case 'select': {
                    genericUtils.setProperty(i, 'isSelectOption', true);
                    break;
                }
                case 'ability': {
                    genericUtils.setProperty(i, 'isSelectOption', true);
                    genericUtils.setProperty(i, 'options', Object.values(CONFIG.DND5E.abilities).map(j => ({
                        label: j.label,
                        value: j.abbreviation
                    })));
                    break;
                }
                case 'saves': {
                    genericUtils.setProperty(i, 'isSelectOption', true);
                    genericUtils.setProperty(i, 'options', [
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.Overtime.Labels.Spellcasting',
                            value: '@attributes.spelldc'
                        },
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.Overtime.Labels.Item',
                            value: '@item.save.dc'
                        },
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.Overtime.Labels.Flat',
                            value: 'flat'
                        },
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.Overtime.Labels.Ability',
                            value: 'ability'
                        }
                    ]);
                    break;
                }
                case 'damageTypes': {
                    genericUtils.setProperty(i, 'isSelectOption', true);
                    genericUtils.setProperty(i, 'options', Object.entries(CONFIG.DND5E.damageTypes).map(([key, value]) => ({
                        label: value.label,
                        value: key
                    })));
                    break;
                }
            }
            fieldsets[i.fieldset].options.push(i);
        });
        genericUtils.setProperty(context.overTime, 'fieldsets', fieldsets);
        return context;
    }
    static async _apply(event, target) {
        let effect = this.effectDocument;
        // save the stuff from context to the actual effect
        await this.updateContext(effect);
    }
    static async confirm(event, target) {
        await EffectMedkit._apply.bind(this)(event, target);
        this.close();
    }
    get title() {
        return this.windowTitle;
    }
    async updateContext(item) {
        let newContext = await EffectMedkit.createContext(item);
        // Probably only need a function to figure out the overtimes, not the whole thing.
        this.context = newContext;
        this.render(true);
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
            {type: 'button', action: 'apply', label: 'CHRISPREMADES.Generic.Apply', name: 'apply', icon: 'fa-solid fa-download'},
            {type: 'submit', action: 'confirm', label: 'CHRISPREMADES.Generic.Confirm', name: 'confirm', icon: 'fa-solid fa-check'}
        ];
        return context;
    }
    // Handles changes to the form, checkbox marks etc, updates the context store and forces a re-render
    async _onChangeForm(formConfig, event) {
        for (let key of Object.keys(this.tabsData)) {
            this.tabsData[key].cssClass = '';
        }
        let currentTabId = this.element.querySelector('.item.active').getAttribute('data-tab');
        this.tabsData[currentTabId].cssClass = 'active';

        // Need to dynamically update overtime??
        // Set checkbox, conditions, and macros to context
        if (event.target.name.includes('devTools')) {
            let value = event.target.value;
            if (['actor', 'item'].includes(event.target.id)) {
                this.context.devTools.midi[event.target.id] = value;
            } else this.context.devTools[event.target.id] = value;
        }
        //this.render(true);
    }
}