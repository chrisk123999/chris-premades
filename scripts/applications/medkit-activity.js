let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {genericUtils, constants, activityUtils, itemUtils} from '../utils.js';
import {EmbeddedMacros} from './embeddedMacros.js';
export class ActivityMedkit extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(context, activity) {
        super({id: 'medkit-window-activity'});
        this.windowTitle = 'Cauldron of Plentiful Resources Configuration: ' + context.label;
        this.activityDocument = activity;
        this.context = context;
        if (genericUtils.getCPRSetting('enableEmbeddedMacrosEditing')) {
            this.activeTab = 'embeddedMacros';
        } else {
            this.activeTab = 'devTools';
        }
    }
    // TODO: MODIFY THING TO HAVE TABS
    static DEFAULT_OPTIONS = {
        tag: 'form',
        form: {
            handler: ActivityMedkit.formHandler,
            submitOnChange: false,
            closeOnSubmit: false,
            id: 'ActivityMedkit-window'
        },
        actions: {
            confirm: ActivityMedkit.confirm,
            openEmbeddedMacros: ActivityMedkit._openEmbeddedMacros
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
        embeddedMacros: {
            template: 'modules/chris-premades/templates/embedded-macros.hbs',
            scrollable: ['']
        },
        devTools: {
            template: 'modules/chris-premades/templates/medkit-activity-dev-tools.hbs',
            scrollable: ['']
        },
        footer: {
            template: 'templates/generic/form-footer.hbs'
        }
    };
    get activeTab() {
        return this._activeTab;
    }
    set activeTab(tab) {
        this._activeTab = tab;
    }
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
                cprHide: activity?.item?.flags?.['chris-premades']?.hiddenActivities?.includes(activityIdentifier) ? true: false,
                spellActivity: activity?.item?.flags?.['chris-premades']?.spellActivities?.includes(activityIdentifier) ? true : false
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
    static _openEmbeddedMacros(event, target) {
        new EmbeddedMacros(this.activityDocument).render(true);
    }
    // Saves the context data to the effect
    static async confirm(event, target) {
        let item = this.activityDocument.item;
        if (!item) {
            this.close();
            return;
        }
        let hiddenActivities = itemUtils.getHiddenActivities(item) ?? [];
        let spellActivities = itemUtils.getSpellActivities(item) ?? [];
        let prevIdentifier = activityUtils.getIdentifier(this.activityDocument);
        let newIdentifier = this.context.config.identifier;
        let prevHidden = hiddenActivities.includes(prevIdentifier) ? true : false;
        let prevspellActivity = spellActivities.includes(prevIdentifier) ? true : false;
        let newHidden = this.context.config.cprHide;
        let newSpellActivity = this.context.config.spellActivity;
        if (prevIdentifier === newIdentifier) {
            if (prevHidden === newHidden && prevspellActivity === newSpellActivity) {
                this.close();
                return;
            }
            if (prevHidden != newHidden) {
                if (newHidden) {
                    hiddenActivities.push(newIdentifier);
                } else {
                    hiddenActivities = hiddenActivities.toSpliced(hiddenActivities.findIndex(i => i === prevIdentifier), 1);
                }
                await itemUtils.setHiddenActivities(item, hiddenActivities);
            }
            if (prevspellActivity != newSpellActivity) {
                if (newSpellActivity) {
                    spellActivities.push(newIdentifier);
                } else {
                    spellActivities = spellActivities.toSpliced(spellActivities.findIndex(i => i === prevIdentifier), 1);
                }
                await itemUtils.setSpellActivities(item, spellActivities);
            }
            await genericUtils.update(item);
            this.close();
            return;
        }
        // Identifier changed
        // Get spliced hidden activity array
        if (prevHidden) hiddenActivities = hiddenActivities.toSpliced(hiddenActivities.findIndex(i => i === prevIdentifier), 1);
        if (newHidden) hiddenActivities.push(newIdentifier);
        await itemUtils.setHiddenActivities(item, hiddenActivities);
        if (prevspellActivity) spellActivities = spellActivities.toSpliced(spellActivities.findIndex(i => i === prevIdentifier), 1);
        if (newSpellActivity) spellActivities.push(newIdentifier);
        await activityUtils.setIdentifier(this.activityDocument, newIdentifier);
        await genericUtils.update(item);
        this.close();
    }
    get title() {
        return this.windowTitle;
    }
    async _prepareContext(options) {
        let context = this.context;
        context.tabs ??= {};
        if (genericUtils.getCPRSetting('enableEmbeddedMacrosEditing')) {
            context.tabs.embeddedMacros = {
                icon: 'fa-solid fa-feather-pointed',
                label: 'CHRISPREMADES.Medkit.EmbeddedMacros.Label',
                tooltip: 'CHRISPREMADES.Medkit.Tabs.EmbeddedMacros.Tooltip',
                cssClass: this.activeTab === 'embeddedMacros' ? 'active' : ''
            };
        }
        if (genericUtils.getCPRSetting('devTools')) {
            context.tabs.devTools = {
                icon: 'fa-solid fa-wand-magic-sparkles',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Label',
                tooltip: 'CHRISPREMADES.Medkit.Tabs.DevTools.Tooltip',
                cssClass: this.activeTab === 'devTools' ? 'active' : ''
            };
        }
        context.buttons = [
            {type: 'submit', action: 'confirm', label: 'DND5E.Confirm', name: 'confirm', icon: 'fa-solid fa-check'}
        ];
        return context;
    }
    async _onChangeForm(formConfig, event) {
        let currentTabId = this.element.querySelector('.item.active').getAttribute('data-tab');
        this.activeTab = currentTabId;
        // Update context data
        this.context.config[event.target.id] = (event.target.type === 'checkbox') ? event.target.checked : event.target.value;
        this.render(true);
    }
}