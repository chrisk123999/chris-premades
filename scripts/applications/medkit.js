let { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
import { itemUtils } from '../utils';
import * as macros from './macros.js';

export class Medkit extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(info) {
        super();
        this.windowTitle = 'Chris\'s Premades Configuration: ' + info.item.name;
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
        let info = {};
        info.item.identifier = itemUtils.getIdentifer(item);                          //Internal Identifier used by CPR
        info.item.name = macros[info.item.identifier] ? macros[info.item.identifier].name : item.name;    //Item name matched by the identifier, falls back to the actual item name
        info.item.version = itemUtils.getVersion(item);                               //Version string
        info.item.source = itemUtils.getSource(item);                                 //Automation source: "CPR, GPS, MISC, Other" Other will not have version info and should be treated as being unknown for updated.
        info.item.isUpToDate = itemUtils.isUpToDate(item);                            // -1 for Unknown, 0 for No, 1 for Yes
        new Medkit(info);
        //Item Medkit Dialog Here!
    }
    static async actor(actor) {
        //Actor Medkit Dialog Here!
    }
    // Add results to the object to be handled elsewhere
    static async formHandler(event, form, formData) {
        this.results = foundry.utils.expandObject(formData.object);
    }
    get title() {
        return this.windowTitle;
    }
    // Formats inputs if context store is nullish, otherwise takes the current context store
    async _prepareContext(options) {
        if (!this.context) this.formatInputs();
        let context = this.context;
        return context;
    }
    // Handles changes to the form, checkbox marks etc, updates the context store and forces a re-render
    async _onChangeForm(formConfig, event) {
    }
}