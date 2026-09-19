let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {genericUtils, constants} from '../utils.js';
import {EmbeddedMacros} from './embeddedMacros.js';
export class EffectMedkit extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(context, effectDocument) {
        super({id: 'medkit-window-effect'});
        this.windowTitle = 'Cauldron of Plentiful Resources Configuration: ' + context.label;
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
            confirm: EffectMedkit.confirm,
            openEmbeddedMacros: EffectMedkit._openEmbeddedMacros
        },
        window: {
            icon: 'fa-solid fa-kit-medical',
            resizable: true,
            contentClasses: ['standard-form']
        },
        position: {
            width: 650
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
        embeddedMacros: {
            template: 'modules/chris-premades/templates/embedded-macros.hbs',
            scrollable: ['']
        },
        devTools: {
            template: 'modules/chris-premades/templates/medkit-effect-dev-tools.hbs',
            scrollable: ['']
        },
        footer: {
            template: 'templates/generic/form-footer.hbs'
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
                    value: effect.flags['chris-premades']?.noAnimation ?? false
                },
                conditions: {
                    label: 'CHRISPREMADES.Medkit.Effect.Conditions.Label',
                    tooltip: 'CHRISPREMADES.Medkit.Effect.Conditions.Tooltip',
                    value: effect.flags['chris-premades']?.conditions ?? [],
                    options: CONFIG.statusEffects.map(i => ({label: i.name, value: i.id, isSelected: effect.flags['chris-premades']?.conditions?.includes(i.id) ? true : false}))
                },
                specialDuration: {
                    label: 'CHRISPREMADES.Medkit.Effect.SpecialDuration.Label',
                    tooltip: 'CHRISPREMADES.Medkit.Effect.SpecialDuration.Tooltip',
                    value: effect.flags['chris-premades']?.specialDuration ?? [],
                    options: [
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.SpecialDuration.DamagedByAlly',
                            value: 'damagedByAlly',
                            isSelected: effect.flags['chris-premades']?.specialDuration?.includes('damagedByAlly')
                        },
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.SpecialDuration.DamagedByEnemy',
                            value: 'damagedByEnemy',
                            isSelected: effect.flags['chris-premades']?.specialDuration?.includes('damagedByEnemy')
                        },
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.SpecialDuration.AttackedByAnotherCreature',
                            value: 'attackedByAnotherCreature',
                            isSelected: effect.flags['chris-premades']?.specialDuration?.includes('attackedByAnotherCreature')
                        },
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.SpecialDuration.AttackedBySource',
                            value: 'attackedBySource',
                            isSelected: effect.flags['chris-premades']?.specialDuration?.includes('attackedBySource')
                        },
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.SpecialDuration.HitByAnotherCreature',
                            value: 'hitByAnotherCreature',
                            isSelected: effect.flags['chris-premades']?.specialDuration?.includes('hitByAnotherCreature')
                        },
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.SpecialDuration.HitBySource',
                            value: 'hitBySource',
                            isSelected: effect.flags['chris-premades']?.specialDuration?.includes('hitBySource')
                        },
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.SpecialDuration.ForceSave',
                            value: 'forceSave',
                            isSelected: effect.flags['chris-premades']?.specialDuration?.includes('forceSave')
                        },
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.SpecialDuration.EndOfWorkflow',
                            value: 'endOfWorkflow',
                            isSelected: effect.flags['chris-premades']?.specialDuration?.includes('endOfWorkflow')
                        },
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.SpecialDuration.MoveFinished',
                            value: 'moveFinished',
                            isSelected: effect.flags['chris-premades']?.specialDuration?.includes('moveFinished')
                        },
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.SpecialDuration.ZeroSpeed',
                            value: 'zeroSpeed',
                            isSelected: effect.flags['chris-premades']?.specialDuration?.includes('zeroSpeed')
                        }
                    ].concat(CONFIG.statusEffects.map(i => ({
                        label: i.name + ' ' + genericUtils.translate('CHRISPREMADES.Medkit.Effect.SpecialDuration.Added'),
                        value: i.id,
                        isSelected: effect.flags['chris-premades']?.specialDuration?.includes(i.id)
                    }))).concat(CONFIG.statusEffects.map(i => ({
                        label: i.name + ' ' + genericUtils.translate('CHRISPREMADES.Medkit.Effect.SpecialDuration.Removed'),
                        value: i.id + 'Removed',
                        isSelected: effect.flags['chris-premades']?.specialDuration?.includes(i.id + 'Removed')
                    }))).concat(constants.armorOptions().map(a => ({...a, isSelected: effect.flags['chris-premades']?.specialDuration?.includes(a.value)
                    }))).concat([
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.SpecialDuration.TempHP',
                            value: 'tempHP',
                            isSelected: effect.flags['chris-premades']?.specialDuration?.includes('tempHP')
                        },
                        {
                            label: 'CHRISPREMADES.Medkit.Effect.SpecialDuration.TempMaxHP',
                            value: 'tempMaxHP',
                            isSelected: effect.flags['chris-premades']?.specialDuration?.includes('tempMaxHP')
                        }
                    ].concat(Object.entries(constants.getToolNames()).flatMap(([key, value]) => {
                        return [
                            {
                                label: genericUtils.format('CHRISPREMADES.Medkit.Effect.SpecialDuration.Rolled', {toolName: value}),
                                value: key,
                                isSelected: effect.flags['chris-premades']?.specialDuration?.includes(key)
                            },
                            {
                                label: genericUtils.format('CHRISPREMADES.Medkit.Effect.SpecialDuration.Failed', {toolName: value}),
                                value: key + 'Fail',
                                isSelected: effect.flags['chris-premades']?.specialDuration?.includes(key + 'Fail')
                            },
                            {
                                label: genericUtils.format('CHRISPREMADES.Medkit.Effect.SpecialDuration.Succeed', {toolName: value}),
                                value: key + 'Succeed',
                                isSelected: effect.flags['chris-premades']?.specialDuration?.includes(key + 'Succeed')
                            }
                        ];
                    })))
                }
            },
            macros: {
                effect: JSON?.stringify(effect.flags['chris-premades']?.macros?.effect) ?? '',
                aura: JSON?.stringify(effect.flags['chris-premades']?.macros?.aura) ?? '',
                midi: {
                    item: JSON?.stringify(effect.flags['chris-premades']?.macros?.midi?.item) ?? '',
                    actor: JSON?.stringify(effect.flags['chris-premades']?.macros?.midi?.actor) ?? ''
                },
                combat: JSON?.stringify(effect.flags['chris-premades']?.macros?.combat) ?? '',
                movement: JSON?.stringify(effect.flags['chris-premades']?.macros?.movement) ?? '',
                rest: JSON?.stringify(effect.flags['chris-premades']?.macros?.rest) ?? '',
                save: JSON?.stringify(effect.flags['chris-premades']?.macros?.save) ?? '',
                check: JSON?.stringify(effect.flags['chris-premades']?.macros?.check) ?? '',
                skill: JSON?.stringify(effect.flags['chris-premades']?.macros?.skill) ?? '',
                death: JSON?.stringify(effect.flags['chris-premades']?.macros?.death) ?? '',
                d20: JSON?.stringify(effect.flags['chris-premades']?.macros?.d20) ?? ''
            },
            isDev: game.settings.get('chris-premades', 'devTools'),
            identifier: effect.flags['chris-premades']?.info?.identifier ?? '',
            rules: effect.flags['chris-premades']?.rules ?? ''
        };
        if (effect.parent instanceof Item) {
            genericUtils.setProperty(context.configure, 'templateEffectActivities', {
                label: 'CHRISPREMADES.Medkit.Effect.templateEffectActivities.Label',
                tooltip: 'CHRISPREMADES.Medkit.Effect.templateEffectActivities.Tooltip',
                value: effect.flags['chris-premades']?.templateEffectActivities ?? [],
                options: effect.parent.system.activities.map(activity => ({
                    label: activity.name,
                    value: activity.id,
                    isSelected: effect.flags['chris-premades']?.templateEffectActivities?.includes(activity.id)
                }))
            });
        } else {
            genericUtils.setProperty(context.configure, 'templateEffectActivities', {
                label: 'CHRISPREMADES.Medkit.Effect.templateEffectActivities.Label',
                tooltip: 'CHRISPREMADES.Medkit.Effect.templateEffectActivities.Tooltip',
                value: [],
                options: []
            });
        }
        // Figure out coloring for medkit
        if (context.configure.noAnimation.value || context.configure.conditions.value.length || context.configure.specialDuration.value.length) context.status = 1;
        context.medkitColor = '';
        switch (context.status) {
            case 1:
                context.medkitColor = 'dodgerblue';
                break;
        }
        return context;
    }
    // Allows the overTime fields to be shown
    static async _add(event, target) {
        let autoPos = {...this.position, height: 'auto'};
        this.setPosition(autoPos);
        for (let key of Object.keys(this.tabsData)) {
            this.tabsData[key].cssClass = '';
        }
        let currentTabId = this.element.querySelector('.item.active').getAttribute('data-tab');
        this.tabsData[currentTabId].cssClass = 'active';
        await this.render(true);
        let newPos = {...this.position, height: this.element.scrollHeight};
        this.setPosition(newPos);
    }
    // Saves the context data to the effect
    static async confirm(event, target) {
        let effectData = genericUtils.duplicate(this.effectDocument.toObject());
        let flagUpdates = {};
        genericUtils.setProperty(flagUpdates, 'noAnimation', this.context.configure.noAnimation.value);
        genericUtils.setProperty(flagUpdates, 'conditions', this.context.configure.conditions.value);
        genericUtils.setProperty(flagUpdates, 'specialDuration', this.context.configure.specialDuration.value);
        genericUtils.setProperty(flagUpdates, 'templateEffectActivities', this.context.configure.templateEffectActivities.value);
        if (this.context.identifier) genericUtils.setProperty(flagUpdates, 'info.identifier', this.context.identifier);
        if (this.context.rules) genericUtils.setProperty(flagUpdates, 'rules', this.context.rules);
        if (this.context.macros.effect?.length) genericUtils.setProperty(flagUpdates, 'macros.effect', JSON.parse(this.context.macros.effect.replace(/'/g, '"')));
        if (this.context.macros.aura?.length) genericUtils.setProperty(flagUpdates, 'macros.aura', JSON.parse(this.context.macros.aura.replace(/'/g, '"')));
        if (this.context.macros.midi?.item?.length) genericUtils.setProperty(flagUpdates, 'macros.midi.item', JSON.parse(this.context.macros.midi.item.replace(/'/g, '"')));
        if (this.context.macros.midi?.actor?.length) genericUtils.setProperty(flagUpdates, 'macros.midi.actor', JSON.parse(this.context.macros.midi.actor.replace(/'/g, '"')));
        if (this.context.macros.combat?.length) genericUtils.setProperty(flagUpdates, 'macros.combat', JSON.parse(this.context.macros.combat.replace(/'/g, '"')));
        if (this.context.macros.movement?.length) genericUtils.setProperty(flagUpdates, 'macros.movement', JSON.parse(this.context.macros.movement.replace(/'/g, '"')));
        if (this.context.macros.rest?.length) genericUtils.setProperty(flagUpdates, 'macros.rest', JSON.parse(this.context.macros.rest.replace(/'/g, '"')));
        if (this.context.macros.save?.length) genericUtils.setProperty(flagUpdates, 'macros.save', JSON.parse(this.context.macros.save.replace(/'/g, '"')));
        if (this.context.macros.check?.length) genericUtils.setProperty(flagUpdates, 'macros.check', JSON.parse(this.context.macros.check.replace(/'/g, '"')));
        if (this.context.macros.skill?.length) genericUtils.setProperty(flagUpdates, 'macros.skill', JSON.parse(this.context.macros.skill.replace(/'/g, '"')));
        if (this.context.macros.death?.length) genericUtils.setProperty(flagUpdates, 'macros.death', JSON.parse(this.context.macros.death.replace(/'/g, '"')));
        if (this.context.macros.d20?.length) genericUtils.setProperty(flagUpdates, 'macros.d20', JSON.parse(this.context.macros.d20.replace(/'/g, '"')));
        let effectUpdates = {flags: {'chris-premades': flagUpdates}};
        genericUtils.mergeObject(effectData, effectUpdates);
        let updates = {
            effects: [effectData]
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
                }
            };
            if (genericUtils.getCPRSetting('enableEmbeddedMacrosEditing')) {
                genericUtils.setProperty(tabsData, 'embeddedMacros', {
                    icon: 'fa-solid fa-feather-pointed',
                    label: 'CHRISPREMADES.Medkit.EmbeddedMacros.Label',
                    tooltip: 'CHRISPREMADES.Medkit.Tabs.EmbeddedMacros.Tooltip',
                    cssClass: ''
                });
            }
            if (game.settings.get('chris-premades', 'devTools')) {
                genericUtils.setProperty(tabsData, 'devTools', {
                    icon: 'fa-solid fa-wand-magic-sparkles',
                    label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Label',
                    tooltip: 'CHRISPREMADES.Medkit.Tabs.DevTools.Tooltip',
                    cssClass: ''
                });
            }
            this.tabsData = tabsData;
        }
        context.tabs = this.tabsData;
        context.buttons = [
            {type: 'submit', action: 'confirm', label: 'DND5E.Confirm', name: 'confirm', icon: 'fa-solid fa-check'}
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
                switch (event.target.id) {
                    case 'noAnimation':
                        this.context.configure[event.target.id].value = event.target.checked;
                        break;
                    case 'conditions':
                        this.context.configure.conditions.options.forEach(i => event.target.value.includes(i.value) ? i.isSelected = true : i.isSelected = false);
                        this.context.configure.conditions.value = event.target.value;
                        break;
                    case 'specialDuration':
                        this.context.configure.specialDuration.options.forEach(i => event.target.value.includes(i.value) ? i.isSelected = true : i.isSelected = false);
                        this.context.configure.specialDuration.value = event.target.value;
                        break;
                    case 'templateEffectActivities':
                        this.context.configure.templateEffectActivities.options.forEach(i => event.target.value.includes(i.value) ? i.isSelected = true : i.isSelected = false);
                        this.context.configure.templateEffectActivities.value = event.target.value;
                }
                break;
            }
            case 'devTools': {

                if (event.target.id === 'identifier') {
                    this.context.identifier = event.target.value;
                } else if (event.target.id === 'rules') {
                    this.context.rules = event.target.value;
                } else {
                    let value;
                    try {
                        value = JSON.parse(event.target.value.replace(/'/g, '"'));
                    } catch (error) {
                        ui.notifications.error('Error with ' + event.target.id + ' field, see console');
                        console.error(error);
                    }
                    if (value) {
                        if (event.target.id === 'actor') {
                            this.context.macros.midi.actor = event.target.value;
                        } else if (event.target.id === 'item') {
                            this.context.macros.midi.item = event.target.value;
                        } else {
                            this.context.macros[event.target.id] = event.target.value;
                        }
                    }
                }
            }
        }
        this.render(true);
    }
    static _openEmbeddedMacros(event, target) {
        new EmbeddedMacros(this.effectDocument).render(true);
    }
    changeTab(...args) {
        let autoPos = {...this.position, height: 'auto'};
        this.setPosition(autoPos);
        super.changeTab(...args);
        let newPos = {...this.position, height: this.element.scrollHeight};
        this.setPosition(newPos);
    }
}
