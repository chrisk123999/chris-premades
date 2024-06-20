let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {compendiumUtils, itemUtils, genericUtils} from '../utils.js';
import * as macros from '../macros.js';

export class Medkit extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(context, itemDocument) {
        super();
        this.windowTitle = 'Chris\'s Premades Configuration: ' + context.item.name;
        this.position.width = 450;
        this.itemDocument = itemDocument;
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
        nagivation: {
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
    static async item(item) {
        let context = await Medkit.createContext(item);
        new Medkit(context, item).render(true);
    }
    static async createContext(item) {
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
                canAutomate: {
                    value: genericUtils.checkMedkitPermission('automate', game.userId),
                    tooltip: 'CHRISPREMADES.Medkit.NoPermissions'
                },
                canUpdate: {
                    value: genericUtils.checkMedkitPermission('update', game.userId),
                    tooltip: 'CHRISPREMADES.Medkit.NoPermissions'
                }
            }
        };
        if (context.item.status === -1) context.item.status = context.item.availableAutomations.length > 0;
        if (context.item.status === 1 | context.item.status === 0) context.item.hasAutomation = true;
        context.item.statusLabel = 'CHRISPREMADES.Medkit.Status.' + context.item.status;
        if (context.item.availableAutomations.length > 1 || context.item.status === true) context.item.canApplyAutomation = true;
        if (context.item.availableAutomations.length > 0) {
            context.item.options = [{
                label: 'CHRISPREMADES.Generic.None',
                value: null,
                id: null,
                isSelected: context.item.source ? false : true
            }];
            context.item.availableAutomations.forEach(i => {
                let label;
                if (i.source.includes('.')) {
                    label = game.packs.get(i.source).metadata.label;
                } else {
                    label = 'CHRISPREMADES.Medkit.ModuleIds.' + i.source;
                }
                context.item.options.push({
                    label: label,
                    value: i.document.uuid,
                    id: i.source,
                    isSelected: context.item.source === i.source,
                });
            });
        }
        context.medkitColor = '';
        let sources = [
            'chris-premades',
            'gambit-premades',
            'midi-item-community-showcase'
        ];
        switch (isUpToDate) {
            case 0: context.medkitColor = context.item.source === 'chris-premades' ? 'red' : 'orange';
                break;
            case 1: {
                if (context.item.source === 'chris-premades') {
                    if (macros[identifier].config) {
                        context.medkitColor = 'dodgerblue';
                    } else {
                        context.medkitColor = 'green';
                    }
                } else {
                    context.medkitColor = 'orchid';
                }
                break;
            }
            case -1: {
                let availableItem = await compendiumUtils.getPreferredAutomation(item);
                if (availableItem) context.medkitColor = 'yellow';
                break;
            }
        }
        if (!sources.includes(context.item.source) && context.item.source) {
            context.medkitColor = 'pink';
        }
        if (macros[identifier]?.config) {
            context.category = {};
            let currentConfigs = item.flags['chris-premades']?.config;
            let configs = macros[identifier].config;
            let canConfigure = genericUtils.checkMedkitPermission('configure', game.userId);
            for (let config of configs) {
                if (!context?.category?.[config.category]) {
                    context.category[config.category] = {
                        label: 'CHRISPREMADES.Medkit.Categories.' + config.category + '.Label',
                        tooltip: 'CHRISPREMADES.Medkit.Categories.' + config.category + '.Tooltip',
                        configuration: []
                    };
                }
                if (!canConfigure) {
                    genericUtils.setProperty(configuration, 'isDisabled', true);
                    genericUtils.setProperty(configuration, 'tooltip', 'CHRISPREMADES.Medkit.NoPermission');
                } else if (config?.homebrew && !genericUtils.checkMedkitPermission('homebrew', game.userId)) {
                    genericUtils.setProperty(configuration, 'isDisabled', true);
                    genericUtils.setProperty(configuration, 'tooltip', 'CHRISPREMADES.Medkit.NoPermission');
                }
                let configuration = {
                    label: config.label,
                    name: config.category,
                    id: config.value,
                    value: currentConfigs?.[config.value] ?? config.default
                };
                switch (config.type) {
                    case 'checkbox': {
                        genericUtils.setProperty(configuration, 'isCheckbox', true);
                        if (currentConfigs?.[config.value] === true) genericUtils.setProperty(configuration, 'isChecked', true);
                        break;
                    }
                    case 'file': {
                        genericUtils.setProperty(configuration, 'isFile', true);
                        genericUtils.setProperty(configuration, 'type', config?.fileType ?? 'any');
                        break;
                    }
                    case 'text': {
                        genericUtils.setProperty(configuration, 'isText', true);
                        break;
                    }
                    case 'select': {
                        genericUtils.setProperty(configuration, 'isSelect', true);
                        config.options.forEach(i => {
                            if (!configuration?.options) genericUtils.setProperty(configuration, 'options', []);
                            if (config.requiredModules) {
                                if (config.requiredModules.filter(j => game.modules.get(j)?.active === false).length === 0) {
                                    configuration.options.push({
                                        label: i.label,
                                        value: i.value,
                                        isSelected: i.value === (currentConfigs?.[config.value] ?? config.default)
                                    });
                                }
                            } else {
                                configuration.options.push({
                                    label: i.label,
                                    value: i.value,
                                    isSelected: i.value === (currentConfigs?.[config.value] ?? config.default)
                                });
                            }
                        });
                        break;
                    }
                }
                context.category[config.category].configuration.push(configuration);
            }
        }
        let isDev = game.settings.get('chris-premades', 'devTools');
        if (isDev) {
            let macroInfo = macros[identifier];
            let devTools = {
                hasMacroInfo: macroInfo ? true : false,
                identifier: item.flags?.['chris-premades']?.info?.identifier ?? '',
                version: item.flags?.['chris-premades']?.info?.version ?? macroInfo?.version ?? '',
                source: item.flags?.['chris-premades']?.info?.source ?? '',
                midi: {
                    item: JSON?.stringify(item.flags?.['chris-premades']?.macros?.midi?.item) ?? '',
                    actor: JSON?.stringify(item.flags?.['chris-premades']?.macros?.midi?.actor) ?? '',
                },
                config: macroInfo?.config
            };
            genericUtils.setProperty(context, 'devTools', devTools);
            console.log('CPR Dev Tools | Medkit Item Macro Info: ', context.devTools);
        }
        return context;
    }
    static async update(item, sourceItem, {source, version, identifier} = {}) {
        let itemData = genericUtils.duplicate(item.toObject());
        let sourceItemData = genericUtils.duplicate(sourceItem.toObject());
        let itemType = item.type;
        sourceItemData.name = itemData.name;
        sourceItemData.system.description = itemData.system.description;
        sourceItemData.system.chatFlavor = itemData.system.chatFlavor;
        sourceItemData.system.uses = itemData.system.uses;
        //genericUtils.setProperty(sourceItemData, 'flags.-=chris-premades', null);
        if (itemType === 'spell') sourceItemData.system.preparation = itemData.system.preparation;
        if (itemType != 'spell' && itemType != 'feat') {
            sourceItemData.system.attunement = itemData.system.attunement;
            sourceItemData.system.equipped = itemData.system.equipped;
        }
        if (itemData.system.quantity) sourceItemData.system.quantity;
        let ccssSection = itemData.flags['custom-character-sheet-sections']?.sectionName;
        if (ccssSection) genericUtils.setProperty(sourceItemData, 'flags.custom-character-sheet-sections.sectionName', ccssSection);
        if (itemData.flags.ddbimporter) sourceItemData.flags.ddbimporter = itemData.flags.ddbimporter;
        if (itemData.flags['tidy5e-sheet']) sourceItemData.flags['tidy5e-sheet'] = itemData.flags['tidy5e-sheet'];
        if (source) genericUtils.setProperty(sourceItemData, 'flags.chris-premades.info.source', source);
        if (version) genericUtils.setProperty(sourceItemData, 'flags.chris-premades.info.version', version);
        if (identifier) genericUtils.setProperty(sourceItemData, 'flags.chris-premades.info.identifier', identifier);
        let config = itemData.flags['chris-premades']?.config;
        if (config) genericUtils.setProperty(sourceItemData, 'flags.chris-premades.config', config);
        if (CONFIG.DND5E.defaultArtwork.Item[itemType] != itemData.img) sourceItemData.img = itemData.img;
        if (item.effects.size) await item.deleteEmbeddedDocuments('ActiveEffect', item.effects.map(i => i.id));
        await item.update(sourceItemData);
        return item;
    }
    static async _update(event, target) {
        let item = this.itemDocument;
        if (!item) return;
        let sourceItem = await fromUuid(this.context.item.options.find(i => i.isSelected === true).value);
        if (!sourceItem) return;
        let updatedItem = await Medkit.update(item, sourceItem);
        this.updateContext(updatedItem);
    }
    static async _apply(event, target) {
        let item = this.itemDocument;
        let devTools = this.context?.devTools;
        if (devTools) {
            if (devTools.identifier != '') await item.setFlag('chris-premades', 'info.identifier', devTools.identifier);
            if (devTools.version != '') await item.setFlag('chris-premades', 'info.version', devTools.version);
            if (devTools.source != '') await item.setFlag('chris-premades', 'info.source', devTools.source);
            if (devTools.midi.item != '') {
                let value = undefined;
                try {
                    value = JSON.parse(devTools.midi.item.replace(/'/g, '"'));
                } catch (error) {
                    ui.notifications.error('Error with Midi Item field, see console');
                    console.error(error);
                }
                if (value) await item.setFlag('chris-premades', 'macros.midi.item', value);
            }
            if (devTools.midi.actor != '') {
                let value = undefined;
                try {
                    value = JSON.parse(devTools.midi.actor.replace(/'/g, '"'));
                } catch (error) {
                    ui.notifications.error('Error with Midi Actor field, see console');
                    console.error(error);
                }
                if (value) await item.setFlag('chris-premades', 'macros.midi.actor', value);
            }
        }
        let category = this.context?.category;
        if (category) {
            let configs = {};
            for (let i of Object.values(category)) {
                for (let j of i.configuration) {
                    configs[j.id] = j.value;
                }
            }
            await item.setFlag('chris-premades', 'config', configs);
        }
        let currentSource = item?.flags?.['chris-premades']?.info?.source;
        if ((currentSource && this.context.item?.options?.find(i => i.isSelected && (i.id != currentSource))) || (!currentSource || currentSource === '')) {
            let selectedSource = this.context.item?.options.find(i => i.isSelected);
            let sourceItem = await fromUuid(selectedSource.value);
            if (this.context.item?.options.find(i => i.isSelected).value === null && currentSource) {
                await item.update({'flags.-=chris-premades': null});
            }
            if (sourceItem) {
                item = await Medkit.update(item, sourceItem);
            }
            await item.setFlag('chris-premades', 'info', {source: selectedSource.id});
        }
        this.itemDocument = item;
        await this.updateContext(item);
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
            currentContext.item.options.forEach(i => i.isSelected = false);
            currentContext.item.options[options.selectedIndex].isSelected = true;
        } else if (this?.context?.category && Object.keys(this.context.category).includes(event.target.name)) {
            if (event.target.type === 'select-one') {
                let options = event.target.options;
                let currentContext = this.context;
                currentContext.category[event.target.name].configuration.find(i => i.id === event.target.id).options.forEach(i => i.isSelected = false);
                currentContext.category[event.target.name].configuration.find(i => i.id === event.target.id).options[options.selectedIndex].isSelected = true;
            }
            this.context.category[event.target.name].configuration.forEach(i => {if (i.id === event.target.id) i.value = event.target.value;});
        } else if (event.target.name.includes('devTools')) {
            let value = event.target.value;
            if (['actor', 'item'].includes(event.target.id)) {
                this.context.devTools.midi[event.target.id] = value;
            } else this.context.devTools[event.target.id] = value;
        }
        this.render(true);
    }
}