let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {compendiumUtils, itemUtils, genericUtils} from '../utils.js';
import * as macros from '../macros.js';
export class ActorMedkit extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor) {
        super({id: 'medkit-window-actor'});
        this.windowTitle = 'Chris\'s Premades Configuration: ' + context.name;
        this.position.width = 450;
        this.actor = actor;
        this.identifier = actor.flags['chris-premades']?.info?.identifier; // Not in use yet, will use to pull specific monster automations
    }
    static DEFAULT_OPTIONS = {
        tag: 'form',
        form: {
            handler: ActorMedkit.formHandler,
            submitOnChange: false,
            closeOnSubmit: false,
        },
        actions: {
            update: ActorMedkit._update,
            apply: ActorMedkit._apply,
            close: ActorMedkit.close
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
        character: {
            template: 'modules/chris-premades/templates/medkit-actor-character.hbs'
        },
        npc: {
            template: 'modules/chris-premades/templates/medkit-actor-npc.hbs'
        },
        summary: {
            template: 'modules/chris-premades/templates/medkit-actor-summary.hbs',
            scrollable: ['']
        },
        footer: {
            template: 'modules/chris-premades/templates/form-footer.hbs'
        }
    };
    static async actor(actor) {
        let medkit = new ActorMedkit(actor);
        await medkit.readyData();
        genericUtils.log('log', 'Actor Medkit is not ready for use yet!');
        //medkit.render(true);
    }
    async readyData() {
        // need to get all items, check if they have flags.chris-premades.info, take those identifiers against their source and macros info, tally them up, have sets of each
        this.actorItems = await Promise.all(this.actor.items.map(async i => ({
            item: i, 
            identifier: itemUtils.getIdentifer(i), 
            source: itemUtils.getSource(i), 
            version: itemUtils.getVersion(i),
            isUpToDate: itemUtils.isUpToDate(i),
            sourceItem: await compendiumUtils.getAppliedOrPreferredAutomation(i)
        })));
        this.amounts = {
            upToDate: this.actorItems.reduce(
                (accumulator, currentValue) => currentValue.isUpToDate === 1 ? accumulator + 1 : accumulator,
                0 
            ),
            available: this.actorItems.reduce(
                (accumulator, currentValue) => (!currentValue.source && currentValue.sourceItem) ? accumulator + 1 : accumulator,
                0 
            ),
            outOfDate: this.actorItems.reduce(
                (accumulator, currentValue) => currentValue.isUpToDate === 0 ? accumulator + 1 : accumulator,
                0 
            )
        }
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
        const tabsData = {
            character: {
                icon: 'fa-solid fa-user',
                label: 'CHRISPREMADES.Medkit.Tabs.Character.Label',
                tooltip: 'CHRISPREMADES.Medkit.Tabs.Character.Tooltip',
                cssClass: 'active'
            },
            npc: {
                icon: 'fa-solid fa-clipboard-user',
                label: 'CHRISPREMADES.Medkit.Tabs.NPC.Label',
                tooltip: 'CHRISPREMADES.Medkit.Tabs.NPC.Tooltip',
                cssClass: 'active'
            },
            summary: {
                icon: 'fa-solid fa-file-lines',
                label: 'CHRISPREMADES.Medkit.Tabs.Summary.Label',
                tooltip: 'CHRISPREMADES.Medkit.Tabs.Summary.Tooltip',
                cssClass: ''
            }
        }
        const buttons = [
            {type: 'button', action: 'update', label: 'CHRISPREMADES.Generic.Update', name: 'update', icon: 'fa-solid fa-download'},
            {type: 'submit', action: 'close', label: 'CHRISPREMADES.Generic.Cancel', name: 'close', icon: 'fa-solid fa-xmark'}
        ];
        let context = {
            tabs: tabsData,
            buttons: buttons,
            character: {
                amounts: this.amounts
            },
            npc: {
                amounts: this.amounts,
                identifier: this.identifier
            }
        }
        if (this.actor.type === 'character') delete context.tabs.npc;
        else delete context.tabs.character;
        if (this.amounts.available === 0 & this.amounts.outOfDate === 0) context.buttons.splice(0, 1);
        return context;
    }
    // Handles changes to the form, checkbox marks etc, updates the context store and forces a re-render
    async _onChangeForm(formConfig, event) {
        // will want to take a textbox value for a name to get automations from, keep that and apply when apply
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