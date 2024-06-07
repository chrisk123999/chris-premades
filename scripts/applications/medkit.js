let { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
export class DialogApp extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options) {
        super();
    }
    static DEFAULT_OPTIONS = {
        tag: 'form',
        form: {
            handler: DialogApp.formHandler,
            submitOnChange: false,
            closeOnSubmit: false,
            id: 'dialog-app-window'
        },
        actions: {
            confirm: DialogApp.confirm
        },
        window: {
            title: 'Default Title',
            resizable: true,
        }
    };
    static PARTS = {
        form: {
            template: 'modules/chris-premades/templates/dialogApp.hbs'
        },
        footer: {
            template: 'modules/chris-premades/templates/form-footer.hbs'
        }
    };
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