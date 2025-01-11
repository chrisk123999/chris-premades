let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {compendiumUtils, itemUtils, genericUtils, errors} from '../utils.js';
import {gambitPremades} from '../integrations/gambitsPremades.js';
import {miscPremades} from '../integrations/miscPremades.js';
import {ItemMedkit} from './medkit-item.js';
export class ActorMedkit extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(actor) {
        super({id: 'medkit-window-actor'});
        this.windowTitle = 'Cauldron of Plentiful Resources Configuration: ' + actor.name;
        this.position.width = 550;
        //this.position.max-height = 800;
        this.actor = actor;
        this.identifier = actor.flags['chris-premades']?.info?.identifier ?? actor.prototypeToken.name; // Not in use yet, will use to pull specific monster automations
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
            apply: ActorMedkit.apply,
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
        await medkit.render(true);
    }
    static async actorUpdateAll(actor) {
        let medkit = new ActorMedkit(actor);
        await medkit.readyData();
        await ActorMedkit._update.bind(medkit)();
        return medkit.summary;
    }
    async readyData() {
        this.actorItems = await Promise.all(this.actor.items.map(async i => ({
            item: i, 
            identifier: genericUtils.getIdentifier(i), 
            source: itemUtils.getSource(i), 
            version: itemUtils.getVersion(i),
            isUpToDate: await itemUtils.isUpToDate(i),
            sourceItem: await compendiumUtils.getAppliedOrPreferredAutomation(i, {identifier: this.identifier, rules: itemUtils.getRules(i)})
        })));
        this.amounts = this.actorItems.reduce((accumulator, currentValue) => {
            if (['class', 'subclass'].includes(currentValue.item.type)) return accumulator;
            let source = currentValue.sourceItem ? this.itemSource(currentValue.sourceItem.pack) : currentValue.source;
            if (currentValue.isUpToDate === 1) {
                accumulator.upToDate.value += 1;
                accumulator.upToDate.items.push({name: currentValue.item.name, source});
                accumulator.upToDate.sources = this.countSource(accumulator.upToDate.sources, source);
            } else if ((!currentValue.source || currentValue?.source?.includes('.')) && currentValue.sourceItem) {
                accumulator.available.value += 1;
                accumulator.available.items.push({name: currentValue.item.name, source});
                accumulator.available.sources = this.countSource(accumulator.available.sources, source);
            } else if (currentValue.isUpToDate === 0) {
                accumulator.outOfDate.value += 1;
                accumulator.outOfDate.items.push({name: currentValue.item.name, source});
                accumulator.outOfDate.sources = this.countSource(accumulator.outOfDate.sources, source);
            }
            return accumulator;
        }, {upToDate: {value: 0, sources: {}, items: []}, available: {value: 0, sources: {}, items: []}, outOfDate: {value: 0, sources: {}, items: []}});
        this.tooltips = {
            upToDate: this.generateTooltip(this.amounts.upToDate.items),
            available: this.generateTooltip(this.amounts.available.items),
            outOfDate: this.generateTooltip(this.amounts.outOfDate.items)
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
    generateTooltip(items) {
        let allSources = new Set(items.map(i => i.source));
        let finalText = '';
        for (let source of allSources) {
            let allNames = items.filter(i => i.source === source).map(i => i.name);
            finalText += genericUtils.translate('CHRISPREMADES.Medkit.ModuleIds.' + source) + ': ' + allNames.length + '<br>';
            for (let currName of allNames) {
                finalText += '&#8226 ' + currName + '<br>';
            }
        }
        return finalText;
    }
    update(item, sourceItem, options) {
        let source = options.source ?? itemUtils.getSource(sourceItem);
        let summary = '&#8226 ' + item.name + ' - ' + (source.includes('.') ? game.packs.get(source).metadata.label : genericUtils.translate('CHRISPREMADES.Medkit.ModuleIds.' + source)) + '<br/>';
        this.summary += summary;
        return ItemMedkit.update(item, sourceItem, options);
    }
    static async _update(event, target) {
        await Promise.all(this.actorItems.reduce((accumulator, currentValue) => {
            if (currentValue.isUpToDate !== 1 && (currentValue.isUpToDate === 0 || ((!currentValue.source || currentValue?.source?.includes('.')) && currentValue.sourceItem))) {
                let options = {source: undefined, version: undefined};
                if (currentValue.sourceItem?.pack.includes('gambits-premades')) {
                    options.source = 'gambits-premades';
                    if (currentValue.item?.actor?.type === 'character' || currentValue.item.type === 'spell') {
                        options.version = gambitPremades.gambitItems.find(i => i.name === currentValue.sourceItem.name)?.version;
                    } else {
                        options.version = gambitPremades.gambitMonsters.find(i => i.name === currentValue.sourceItem.name && i.monster === this.identifier)?.version;
                    }
                } else if (currentValue.sourceItem?.pack.includes('midi-item-showcase-community')) {
                    options.source = 'midi-item-showcase-community';
                    options.version = miscPremades.miscItems.find(i => i.name === currentValue.sourceItem.name)?.version;
                    if (currentValue.item?.actor?.type === 'character'  || currentValue.item.type === 'spell') {
                        options.version = miscPremades.miscItems.find(i => i.name === currentValue.sourceItem.name)?.version;
                    } else {
                        options.version = miscPremades.miscMonsters.find(i => i.name === currentValue.sourceItem.name && i.monster === this.identifier)?.version;
                    }
                } else if (!currentValue.sourceItem?.pack.includes('chris-premades') && !currentValue.sourceItem?.flags['chris-premades']?.info) {
                    options.source = currentValue.sourceItem?.pack;
                }
                if (!options.source && !itemUtils.getSource(currentValue.sourceItem)) {
                    genericUtils.notify('Error with ' + currentValue.item.name + ', skipping item', 'warn');
                    return accumulator;
                }
                if (['class', 'subclass'].includes(currentValue.item.type)) return accumulator;
                accumulator.push(this.update(currentValue.item, currentValue.sourceItem, options));
            }
            return accumulator;
        }, []));
        if (this.rendered) {
            let maxHeight = (canvas.screenDimensions[1] * 0.9);
            let position = {...this.position, height: ((this.amounts.available.value + this.amounts.outOfDate.value) * 15 + 310) > (maxHeight) ? maxHeight : 'auto'};
            this.setPosition(position);
            await this.render(true, {position: {top: null}});
        }
    }
    static async apply(event, target) {
        let currentTabId = this.element.querySelector('.item.active').getAttribute('data-tab');
        switch (currentTabId) {
            case 'npc': {
                if (this.identifier != this.actor.prototypeToken.name) {
                    await this.actor.setFlag('chris-premades', 'info.identifier', this.identifier);
                } else if ((this.identifier === this.actor.prototypeToken.name) && this.actor.flags['chris-premades']?.info?.identifier) {
                    await this.actor.unsetFlag('chris-premades', 'info.identifier');
                }
                break;
            }
        }
        await this.readyData();
        this.render(true);
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
        const buttons = [];
        if ((this.amounts.available.value != 0 || this.amounts.outOfDate.value != 0) && !this.summary.length) {
            buttons.push({type: 'button', action: 'update', label: 'CHRISPREMADES.Generic.Update', name: 'update', icon: 'fa-solid fa-download'});
        }
        if (this.actor.type === 'npc' && !this.summary.length) {
            buttons.push({type: 'button', action: 'apply', label: 'DND5E.Apply', name: 'apply', icon: 'fa-solid fa-download'});
        }
        buttons.push({type: 'submit', action: 'close', label: 'CHRISPREMADES.Generic.Close', name: 'close', icon: 'fa-solid fa-xmark'});
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
                noAutomationFound: ((this.amounts.available.value === 0) && (this.amounts.outOfDate.value === 0) && (this.amounts.upToDate.value === 0)) ? true : false,
                tooltips: this.tooltips,
                identifier: this.identifier
            },
            summary: {
                value: this.summary
            }
        };
        return context;
    }
    async _onChangeForm(formConfig, event) {
        let currentTabId = this.element.querySelector('.item.active').getAttribute('data-tab');
        switch (currentTabId) {
            case 'npc': {
                let targetInput = event.target;
                this[targetInput.id] = targetInput.value;
                break;
            }
        }
    }
    changeTab(...args) {
        let autoPos = {...this.position, height: 'auto'};
        this.setPosition(autoPos);
        super.changeTab(...args);
        let newPos = {...this.position, height: this.element.scrollHeight};
        this.setPosition(newPos);
    }
}