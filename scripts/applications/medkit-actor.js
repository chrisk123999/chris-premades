let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {compendiumUtils, itemUtils, genericUtils, errors} from '../utils.js';
import {gambitPremades} from '../integrations/gambitsPremades.js';
import {miscPremades} from '../integrations/miscPremades.js';
import {Medkit} from './medkit.js';
export class ActorMedkit extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor) {
        super({id: 'medkit-window-actor'});
        this.windowTitle = 'Chris\'s Premades Configuration: ' + actor.name;
        this.position.width = 550;
        //this.position.max-height = 800;
        this.actor = actor;
        this.identifier = actor.flags['chris-premades']?.info?.identifier; // Not in use yet, will use to pull specific monster automations
        this.summary = '';
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
        medkit.render(true);
    }
    async readyData() {
        this.actorItems = await Promise.all(this.actor.items.map(async i => ({
            item: i, 
            identifier: itemUtils.getIdentifer(i), 
            source: itemUtils.getSource(i), 
            version: itemUtils.getVersion(i),
            isUpToDate: itemUtils.isUpToDate(i),
            sourceItem: await compendiumUtils.getAppliedOrPreferredAutomation(i)
        })));
        this.amounts = this.actorItems.reduce((accumulator, currentValue) => {
            if (currentValue.isUpToDate === 1) {
                accumulator.upToDate.value += 1;
                accumulator.upToDate.sources = this.countSource(accumulator.upToDate.sources, currentValue.source);
            } else if ((!currentValue.source || currentValue?.source?.includes('.')) && currentValue.sourceItem) {
                accumulator.available.value += 1;
                accumulator.available.sources = this.countSource(accumulator.available.sources, this.itemSource(currentValue.sourceItem.pack));
            } else if (currentValue.isUpToDate === 0) {
                accumulator.outOfDate.value += 1;
                accumulator.outOfDate.sources = this.countSource(accumulator.outOfDate.sources, currentValue.source);
            }
            return accumulator;
        }, {upToDate: {value: 0, sources: {}}, available: {value: 0, sources: {}}, outOfDate: {value: 0, sources: {}}});
        this.tooltips = {
            upToDate: this.generateTooltip(this.amounts.upToDate.sources),
            available: this.generateTooltip(this.amounts.available.sources),
            outOfDate: this.generateTooltip(this.amounts.outOfDate.sources)
        };
    }
    itemSource(itemPack) {
        if (itemPack.includes('gambits-premades')) {
            return 'gambits-premades';
        } else if (itemPack.includes('midi-item-showcase-community')) {
            return 'midi-item-showcase-community';
        } else if (itemPack.includes('chris-premades')) {
            return 'chris-premades';
        } else {
            return 'additionalCompendiums';
        }
    }
    countSource(accumulator, itemSource) {
        if (!accumulator[itemSource]) {
            genericUtils.setProperty(accumulator, itemSource, 1);
            return accumulator;
        } else {
            accumulator[itemSource] += 1;
            return accumulator;
        }
    }
    generateTooltip(sources) {
        return Object.entries(sources).reduce((accumulator, [key, value]) => {
            return accumulator + genericUtils.translate('CHRISPREMADES.Medkit.ModuleIds.' + key) + ': ' + value + '<br>';
        }, '');
    }
    update(item, sourceItem, options) {
        let source = options.source ?? itemUtils.getSource(sourceItem);
        let summary = '&#8226 ' + item.name + ' - ' + (source.includes('.') ? game.packs.get(source).metadata.label : genericUtils.translate('CHRISPREMADES.Medkit.ModuleIds.' + source)) + '<br/>';
        this.summary += summary;
        return Medkit.update(item, sourceItem, options);
    }
    static async _update(event, target) {
        await Promise.all(this.actorItems.reduce((accumulator, currentValue) => {
            if (currentValue.isUpToDate === 0 || ((!currentValue.source || currentValue?.source?.includes('.')) && currentValue.sourceItem)) {
                let options = {source: undefined, version: undefined};
                if (currentValue.sourceItem.pack.includes('gambits-premades')) {
                    options.source = 'gambits-premades';
                    options.version = gambitPremades.gambitItems.find(i => i.name === currentValue.sourceItem.name)?.version;
                } else if (currentValue.sourceItem.pack.includes('midi-item-showcase-community')) {
                    options.source = 'midi-item-showcase-community';
                    options.version = miscPremades.miscItems.find(i => i.name === currentValue.sourceItem.name)?.version;
                } else if (!currentValue.sourceItem.pack.includes('chris-premades') && !currentValue.sourceItem.flags['chris-premades']?.info) {
                    options.source = currentValue.sourceItem.pack;
                }
                if (!options.source && !itemUtils.getSource(currentValue.sourceItem)) {
                    genericUtils.notify('Error with ' + currentValue.item.name + ', skipping item');
                    return accumulator;
                }
                accumulator.push(this.update(currentValue.item, currentValue.sourceItem, options));
            }
            return accumulator;
        }, []));
        let maxHeight = (canvas.screenDimensions[1] * 0.9);
        let position = {...this.position, height: ((this.amounts.available.value + this.amounts.outOfDate.value) * 15 + 310) > (maxHeight) ? maxHeight : 'auto'};
        this.setPosition(position);
        this.render(true, {position: {top: null}});
    }
    static async confirm(event, target) {
        await ActorMedkit._apply.bind(this)(event, target);
        this.close();
    }
    get title() {
        return this.windowTitle;
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
                cssClass: 'active'
            }
        };
        const buttons = [
            {type: 'button', action: 'update', label: 'CHRISPREMADES.Generic.Update', name: 'update', icon: 'fa-solid fa-download'},
            {type: 'submit', action: 'close', label: 'CHRISPREMADES.Generic.Close', name: 'close', icon: 'fa-solid fa-xmark'}
        ];
        let context = {
            tabs: this.summary.length ? {summary: tabsData.summary} : this.actor.type === 'npc' ? {npc: tabsData.npc} : {character: tabsData.character},
            buttons: buttons,
            label: this.actor.name,
            character: {
                amounts: this.amounts,
                tooltips: this.tooltips
            },
            npc: {
                amounts: this.amounts,
                identifier: this.identifier
            },
            summary: {
                value: this.summary
            }
        };
        if ((this.amounts.available.value === 0 & this.amounts.outOfDate.value === 0) || this.summary.length) context.buttons.splice(0, 1);
        return context;
    }
    async _onChangeForm(formConfig, event) {
        // will want to take a textbox value from the NPC tab for a name to get automations from, keep that and apply when apply
        /*
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
        */
    }
    changeTab(...args) {
        let autoPos = {...this.position, height: 'auto'};
        this.setPosition(autoPos);
        super.changeTab(...args);
        let newPos = {...this.position, height: this.element.scrollHeight};
        this.setPosition(newPos);
    }
}