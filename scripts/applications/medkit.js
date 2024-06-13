let { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
import { compendiumUtils, itemUtils } from '../utils.js';
import * as macros from '../macros.js';

export class Medkit extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(context, item) {
        super();
        this.windowTitle = 'Chris\'s Premades Configuration: ' + context.item.name;
        this.item = item;
        this.context = context;
    }
    static DEFAULT_OPTIONS = {
        tag: 'form',
        form: {
            handler: Medkit.formHandler,
            submitOnChange: false,
            closeOnSubmit: false,
            id: 'medkit-window'
        },
        actions: {
            apply: Medkit._apply,
            update: Medkit._update
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
        nagivation: {
            template: 'modules/chris-premades/templates/medkit-navigation.hbs'
        },
        info: {
            template: 'modules/chris-premades/templates/medkit-info.hbs'
        },
        footer: {
            template: 'modules/chris-premades/templates/form-footer.hbs'
        }
    };
    static async item(item) {
        let identifier = itemUtils.getIdentifer(item);
        let isUpToDate = itemUtils.isUpToDate(item);
        let context = {
            item: {
                identifier: identifier,
                name: macros[identifier] ? macros[identifier].name : item.name,
                label: identifier ? macros[identifier].name === item.name ? item.name : item.name + ' (' + macros[identifier].name + ')' : item.name,
                version: itemUtils.getVersion(item),
                source: itemUtils.getSource(item),
                isUpToDate: isUpToDate,
                availableAutomations: await compendiumUtils.getAllAutomations(item),
                status: isUpToDate,
                type: item.type,
                hasAutomation: false,
                canApplyAutomation: false,
            }
        };
        if (context.item.status === -1) context.item.status = context.item.availableAutomations.length > 0;
        if (context.item.status === 1 | context.item.status === 0) context.item.hasAutomation = true;
        context.item.statusLabel = 'CHRISPREMADES.Medkit.Status.' + context.item.status;
        if (context.item.availableAutomations.length > 1 || context.item.status === true) context.item.canApplyAutomation = true;
        if (context.item.availableAutomations.length > 0) {
            context.item.options = [];
            context.item.availableAutomations.forEach(i => {
                let label = i.source.includes('.') ? i.source : 'CHRISPREMADES.Medkit.ModuleIds.' + i.source;
                context.item.options.push({
                    label: label,
                    id: i.document.uuid,
                    isSelected: context.item.options.length === 0
                });
            });
        }
        new Medkit(context, item).render(true);
    }
    static async _update(event, target) {
        console.log(event, target);
    }
    static async apply(item, sourceItem) {
        console.log('Make ', item, ' into ', sourceItem);
    }
    static async _apply(event, target) {
        console.log(event, target, this.item);
    }
    // Add results to the object to be handled elsewhere
    static async formHandler(event, form, formData) {
        this.results = foundry.utils.expandObject(formData.object);
    }
    get title() {
        return this.windowTitle;
    }
    async _prepareContext(options) {
        let context = this.context;
        context.tabs = {
            info: {
                icon: 'fa-solid fa-wrench',
                label: 'Info', // will localize later
                cssClass: 'active'
            }
        };
        return context;
    }
    // Handles changes to the form, checkbox marks etc, updates the context store and forces a re-render
    async _onChangeForm(formConfig, event) {
    }
}