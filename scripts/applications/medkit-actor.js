let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {compendiumUtils, itemUtils, genericUtils} from '../utils.js';
import * as macros from '../macros.js';
export class Medkit extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(context, actor) {
        super({id: 'medkit-window-actor'});
        this.windowTitle = 'Chris\'s Premades Configuration: ' + context.name;
        this.position.width = 450;
        this.actor = actor;
        this.context = context;
    }
    static DEFAULT_OPTIONS = {
        tag: 'form',
        form: {
            handler: Medkit.formHandler,
            submitOnChange: false,
            closeOnSubmit: false,
        },
        actions: {
            update: Medkit._update,
            apply: Medkit._apply,
            confirm: Medkit.confirm
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
        info: {
            template: 'modules/chris-premades/templates/medkit-info.hbs'
        },
        configure: {
            template: 'modules/chris-premades/templates/medkit-configure.hbs',
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
    static async actor(actor) {
        let context = await Medkit.createContext(actor);
        new Medkit(context, actor).render(true);
    }
    static async createContext(item) {
        // need to get all items, check if they have flags.chris-premades.info, take those identifiers against their source and macros info, tally them up, have sets of each
        
    }
    static async update(item, sourceItem, {source, version, identifier} = {}) {
        //
    }
    static async _update(event, target) {
        let item = this.itemDocument;
        if (!item) return;
        let option = this.context.options.find(i => i.isSelected === true);
        let sourceItem = await fromUuid(option?.value);
        if (!sourceItem) return;
        let updatedItem = await Medkit.update(item, sourceItem, {source: option.id, version: option.version});
        this.updateContext(updatedItem);
    }
    static async _apply(event, target) {
        //
    }
    static async confirm(event, target) {
        await Medkit._apply.bind(this)(event, target);
        this.close();
    }
    get title() {
        return this.windowTitle;
    }
    async updateContext(item) {
        let newContext = await Medkit.createContext(item);
        this.context = newContext;
        this.render(true);
    }
    async _prepareContext(options) {
        let context = this.context;
        if (!this?.tabsData) {
            let tabsData = {
                info: {
                    icon: 'fa-solid fa-hammer',
                    label: 'CHRISPREMADES.Medkit.Tabs.Info.Label',
                    tooltip: 'CHRISPREMADES.Medkit.Tabs.Info.Tooltip',
                    cssClass: 'active'
                }
            };
            if (context?.category) {
                genericUtils.setProperty(tabsData, 'configure', {
                    icon: 'fa-solid fa-wrench',
                    label: 'CHRISPREMADES.Medkit.Tabs.Configuration.Label',
                    tooltip: 'CHRISPREMADES.Medkit.Tabs.Configuration.Tooltip',
                    cssClass: ''
                });
            } 
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
        if (!this.tabsData.configure && context?.category) {
            genericUtils.setProperty(this.tabsData, 'configure', {
                icon: 'fa-solid fa-wrench',
                label: 'CHRISPREMADES.Medkit.Tabs.Configuration.Label',
                tooltip: 'CHRISPREMADES.Medkit.Tabs.Configuration.Tooltip',
                cssClass: ''
            });
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
        if (event.target.id === 'select-automation') {
            let options = event.target.options;
            let currentContext = this.context;
            currentContext.options.forEach(i => i.isSelected = false);
            currentContext.options[options.selectedIndex].isSelected = true;
        } else if (this?.context?.category && Object.keys(this.context.category).includes(event.target.name)) {
            if (event.target.type === 'checkbox') {
                this.context.category[event.target.name].configuration.find(i => i.id === event.target.id).value = event.target.checked;
            } else {
                if (event.target.type === 'select-one') {
                    let options = event.target.options;
                    let currentContext = this.context;
                    currentContext.category[event.target.name].configuration.find(i => i.id === event.target.id).options.forEach(i => i.isSelected = false);
                    currentContext.category[event.target.name].configuration.find(i => i.id === event.target.id).options[options.selectedIndex].isSelected = true;
                }
                this.context.category[event.target.name].configuration.forEach(i => {if (i.id === event.target.id) i.value = event.target.value;});
            }
        } else if (event.target.name.includes('devTools')) {
            let value = event.target.value;
            if (['actor', 'item'].includes(event.target.id)) {
                this.context.devTools.midi[event.target.id] = value;
            } else this.context.devTools[event.target.id] = value;
        }
        this.render(true);
    }
}