let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
export class AdditionalCompendiums extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor() {
        super({id: 'cpr-additional-compendiums-window'});
        this.position.width = 'auto';
        this.position.height = 800;
        this.windowTitle = 'Configure Additional Compendiums';
        this.content = 'Used for medkit updating and some features. Lower number for higher priority.';
    }
    static DEFAULT_OPTIONS = {
        tag: 'form',
        form: {
            handler: AdditionalCompendiums.formHandler,
            submitOnChange: false,
            closeOnSubmit: false,
            id: 'additional-compendiums-window'
        },
        actions: {
            confirm: AdditionalCompendiums.confirm
        },
        window: {
            title: 'Default Title',
            resizable: true,
        }
    };
    static PARTS = {
        header: {
            template: 'modules/chris-premades/templates/additional-compendiums-header.hbs'
        },
        form: {
            template: 'modules/chris-premades/templates/additional-compendiums-form.hbs',
            scrollable: ['']
        },
        footer: {
            template: 'modules/chris-premades/templates/form-footer.hbs'
        }
    };
    static async confirm(event, target) {
        if (!target.name) return false;
        let settings = {};
        for (let compendium of Object.values(this.context.compendiums)) {
            if (!compendium.isChecked) continue;
            settings[compendium.id] = Number(compendium.priority);
        }
        game.settings.set('chris-premades', 'additionalCompendiums', settings);
        this.close();
    }
    get title() {
        return this.windowTitle;
    }
    get results() {
        return this._results;
    }
    set results(value) {
        this._results = value;
    }
    get context() {
        return this._context;
    }
    set context(value) {
        this._context = value;
    }
    makeButton(label, name) {
        return {type: 'submit', action: 'confirm', label: label, name: name};
    }
    formatInputs() {
        let context = {};
        context.content = this.content;
        context.inputs = [];
        let compendiums = { // Default that can be a const somewhere
            'chris-premades': {
                id: 'chris-premades',
                label: 'Chris\'s Premades',
                priority: 1,
                isChecked: false
            },
            'gambit-premades': {
                id: 'gambit-premades',
                label: 'Gambit\'s Premades',
                priority: 2,
                isChecked: false,
                isAvailable: game.modules.get('gambit-premades')?.active
            },
            'midi-item-community-showcase' : {
                id: 'midi-item-community-showcase',
                label: 'Midi Items Community Showcase',
                priority: 3,
                isChecked: false,
                isAvailable: game.modules.get('midi-item-community-showcase')?.active
            }
        };
        let modulePacks = ['chris-premades', 'gambit-premades', 'midi-item-community-showcase']; // Default that can be a const somewhere
        let packs = game.packs.filter(i => i.metadata.type === 'Item').filter(i => !modulePacks.includes(i.metadata.packageName));
        for (let pack of packs) {
            compendiums[pack.metadata.name] = {
                id: pack.metadata.id,
                label: pack.metadata.label,
                priority: 50,
                isChecked: false
            };
        }
        let currentSettings = game.settings.get('chris-premades', 'additionalCompendiums');
        if (!currentSettings) {
            this.render(false);
            return;
        }
        for (let [key, value] of Object.entries(currentSettings)) {
            let pack = game.packs.get(key);
            compendiums[pack?.metadata?.name ?? key] = {
                id: key,
                label: pack?.metadata?.label ?? compendiums[key].label,
                priority: value,
                isChecked: true
            };
        }
        context.compendiums = compendiums;
        context.buttons = [this.makeButton('CHRISPREMADES.Generic.Ok', 'true'), this.makeButton('CHRISPREMADES.Generic.Cancel', 'false')];
        this.context = context;
    }
    async _prepareContext(options) {
        if (!this.context) this.formatInputs();
        let context = this.context;
        return context;
    }
    async _onChangeForm(formConfig, event) {
        let targetInput = event.target;
        let currentContext = this.context;
        if (targetInput.type === 'checkbox') {
            foundry.utils.setProperty(currentContext, 'compendiums.' + targetInput.name + '.isChecked', targetInput?.checked);
        }
        else if (targetInput.type === 'number') {
            foundry.utils.setProperty(currentContext, 'compendiums.' + targetInput.name, Number(targetInput?.value));
        }
        this.context = currentContext;
        this.render(true);
    }
}