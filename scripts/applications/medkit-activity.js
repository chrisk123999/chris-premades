let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {genericUtils, constants, activityUtils, itemUtils} from '../utils.js';
export class ActivityMedkit extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(context, activity) {
        super({id: 'medkit-window-activity'});
        this.windowTitle = 'Cauldron of Plentiful Resources Configuration: ' + context.label;
        this.position.width = 650;
        this.activityDocument = activity;
        this.context = context;
    }
    static DEFAULT_OPTIONS = {
        tag: 'form',
        form: {
            handler: ActivityMedkit.formHandler,
            submitOnChange: false,
            closeOnSubmit: false,
            id: 'ActivityMedkit-window'
        },
        actions: {
            confirm: ActivityMedkit.confirm
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
        devTools: {
            template: 'modules/chris-premades/templates/medkit-activity-dev-tools.hbs',
            scrollable: ['']
        },
        footer: {
            template: 'modules/chris-premades/templates/form-footer.hbs'
        }
    };
    static async activity(activity) {
        let context = await ActivityMedkit.createContext(activity);
        new ActivityMedkit(context, activity).render(true);
    }
    static async createContext(activity) {
        let activityIdentifier = activityUtils.getIdentifier(activity);
        let context = {
            label: activity.name,
            status: '', // Will indicate the label/color of medkit
            config: {
                identifier: activityIdentifier,
                cprHide: activity?.item?.flags?.['chris-premades']?.hiddenActivities?.includes(activityIdentifier) ? true: false
            },
        };
        // Figure out coloring for medkit
        if (context.config.identifier?.length) context.status = 1;
        context.medkitColor = '';
        switch (context.status) {
            case 1:
                context.medkitColor = 'dodgerblue';
                break;
        }
        return context;
    }
    // Saves the context data to the effect
    static async confirm(event, target) {
        let item = this.activityDocument.item;
        if (!item) {
            this.close();
            return;
        }
        let hiddenActivities = itemUtils.getHiddenActivities(item) ?? [];
        let prevIdentifier = activityUtils.getIdentifier(this.activityDocument);
        let newIdentifier = this.context.config.identifier;
        let prevHidden = hiddenActivities.includes(prevIdentifier) ? true : false;
        let newHidden = this.context.config.cprHide;
        if (prevIdentifier === newIdentifier) {
            if (prevHidden === newHidden) {
                this.close();
                return;
            }
            // Same identifier, changed hidden
            if (newHidden) {
                hiddenActivities.push(newIdentifier);
            } else {
                hiddenActivities = hiddenActivities.toSpliced(hiddenActivities.findIndex(i => i === prevIdentifier), 1);
            }
            await itemUtils.setHiddenActivities(item, hiddenActivities);
            await genericUtils.update(item);
            this.close();
            return;
        }
        // Identifier changed
        // Get spliced hidden activity array
        if (prevHidden) hiddenActivities = hiddenActivities.toSpliced(hiddenActivities.findIndex(i => i === prevIdentifier), 1);
        if (newHidden) hiddenActivities.push(newIdentifier);
        await itemUtils.setHiddenActivities(item, hiddenActivities);
        await activityUtils.setIdentifier(this.activityDocument, newIdentifier);
        await genericUtils.update(item);
        this.close();
    }
    get title() {
        return this.windowTitle;
    }
    async _prepareContext(options) {
        let context = this.context;
        context.buttons = [
            {type: 'submit', action: 'confirm', label: 'DND5E.Confirm', name: 'confirm', icon: 'fa-solid fa-check'}
        ];
        return context;
    }
    async _onChangeForm(formConfig, event) {
        // Update context data
        this.context.config[event.target.id] = (event.target.type === 'checkbox') ? event.target.checked : event.target.value;
        this.render(true);
    }
}