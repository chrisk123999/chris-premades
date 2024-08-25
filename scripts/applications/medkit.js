let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {compendiumUtils, itemUtils, genericUtils} from '../utils.js';
import * as macros from '../macros.js';
export class Medkit extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(context, itemDocument) {
        super({id: 'medkit-window-item'});
        this.windowTitle = 'Chris\'s Premades Configuration: ' + context.name;
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
        navigation: {
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
        let identifier = genericUtils.getIdentifier(item);
        let isUpToDate = itemUtils.isUpToDate(item);
        let context = {
            identifier: identifier,
            name: macros[identifier] ? macros[identifier].name : item.name,
            label: macros[identifier] ? macros[identifier].name === item.name ? item.name : item.name + ' (' + macros[identifier].name + ')' : item.name,
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
                tooltip: 'CHRISPREMADES.Medkit.NoPermission'
            },
            canUpdate: {
                value: genericUtils.checkMedkitPermission('update', game.userId),
                tooltip: 'CHRISPREMADES.Medkit.NoPermission'
            }
        };
        if (context.status === -1) context.status = context.availableAutomations.length > 0;
        if (context.status === 1 | context.status === 0) context.hasAutomation = true;
        context.statusLabel = 'CHRISPREMADES.Medkit.Status.' + context.status;
        if (context.availableAutomations.length > 0) {
            context.options = [{
                label: 'DND5E.None',
                value: null,
                id: null,
                isSelected: (context.source || game.settings.get('chris-premades', 'devTools')) ? false : true,
                version: null
            }];
            context.availableAutomations.forEach(i => {
                let label;
                if (i.source.includes('.')) {
                    label = game.packs.get(i.source).metadata.label;
                } else {
                    label = 'CHRISPREMADES.Medkit.ModuleIds.' + i.source;
                }
                context.options.push({
                    label: label,
                    value: i.document.uuid,
                    id: i.source,
                    isSelected: context.source === i.source,
                    version: i.version
                });
            });
        }
        if (!context.options) context.options = [];
        if (context.options.length > 1 || context.status === true) context.canApplyAutomation = true;
        context.medkitColor = '';
        let sources = [
            'chris-premades',
            'gambits-premades',
            'midi-item-showcase-community'
        ];
        switch (isUpToDate) {
            case 0: context.medkitColor = context.source === 'chris-premades' ? 'red' : 'orange';
                break;
            case 1: {
                if (context.source === 'chris-premades') {
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
        if (!sources.includes(context.source) && context.source) {
            context.medkitColor = 'pink';
        }
        let configs = macros[identifier]?.config;
        if (!configs) configs = item.flags['chris-premades']?.customConfig;
        if (configs) {
            context.category = {};
            let currentConfigs = item.flags['chris-premades']?.config;
            let canConfigure = genericUtils.checkMedkitPermission('configure', game.userId);
            for (let config of configs) {
                if (!context?.category?.[config.category]) {
                    context.category[config.category] = {
                        label: 'CHRISPREMADES.Medkit.Categories.' + config.category + '.Label',
                        tooltip: 'CHRISPREMADES.Medkit.Categories.' + config.category + '.Tooltip',
                        configuration: []
                    };
                }
                let configuration = {
                    label: config.label,
                    name: config.category,
                    id: config.value,
                    value: currentConfigs?.[config.value] ?? config.default,
                    i18nOption: config?.i18nOption ? genericUtils.translate(config.i18nOption) : false
                };
                if (!canConfigure) {
                    genericUtils.setProperty(configuration, 'isDisabled', true);
                    genericUtils.setProperty(configuration, 'tooltip', 'CHRISPREMADES.Medkit.NoPermission');
                } else if (config?.homebrew && !genericUtils.checkMedkitPermission('homebrew', game.userId)) {
                    genericUtils.setProperty(configuration, 'isDisabled', true);
                    genericUtils.setProperty(configuration, 'tooltip', 'CHRISPREMADES.Medkit.NoPermission');
                }
                switch (config.type) {
                    case 'checkbox': {
                        genericUtils.setProperty(configuration, 'isCheckbox', true);
                        genericUtils.setProperty(configuration, 'isChecked', configuration.value);
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
                        config.options = config.options instanceof Function ? config.options() : config.options;
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
                    case 'select-many': {
                        genericUtils.setProperty(configuration, 'isSelectMany', true);
                        config.options.forEach(i => {
                            if (!configuration?.options) genericUtils.setProperty(configuration, 'options', []);
                            if (config.requiredModules) {
                                if (config.requiredModules.filter(j => game.modules.get(j)?.active === false).length === 0) {
                                    configuration.options.push({
                                        label: i.label,
                                        value: i.value,
                                        isSelected: (currentConfigs?.[config.value] ?? config.default).includes(i.value)
                                    });
                                }
                            } else {
                                configuration.options.push({
                                    label: i.label,
                                    value: i.value,
                                    isSelected: (currentConfigs?.[config.value] ?? config.default).includes(i.value)
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
            context.options.push({
                label: 'Development',
                value: 'development',
                id: 'development',
                isSelected: context?.source === 'development' ? true : context?.source ? false : true,
            });
            let macroInfo = macros[identifier];
            let devTools = {
                hasMacroInfo: macroInfo ? true : false,
                identifier: item.flags?.['chris-premades']?.info?.identifier ?? '',
                version: item.flags?.['chris-premades']?.info?.version ?? macroInfo?.version ?? '',
                source: item.flags?.['chris-premades']?.info?.source ?? '',
                hasAnimation: item.flags?.['chris-premades']?.info?.hasAnimation ?? macroInfo?.hasAnimation ?? false,
                midi: {
                    item: JSON?.stringify(item.flags?.['chris-premades']?.macros?.midi?.item) ?? '',
                    actor: JSON?.stringify(item.flags?.['chris-premades']?.macros?.midi?.actor) ?? '',
                },
                aura: JSON?.stringify(item.flags?.['chris-premades']?.macros?.aura) ?? '',
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
        if (itemData.system.uses) {
            let realPrompt = sourceItemData.system?.uses?.prompt;
            sourceItemData.system.uses = itemData.system.uses;
            sourceItemData.system.uses.prompt = realPrompt;
        }
        let advancementOrigin = itemData.flags.dnd5e?.advancementOrigin;
        if (advancementOrigin) genericUtils.setProperty(sourceItemData, 'flags.dnd5e.advancementOrigin', advancementOrigin);
        let oldOnUse = itemData.flags['midi-qol']?.onUseMacroName;
        if (oldOnUse) {
            let newOnUseString = oldOnUse.split(',').filter(i => !i.includes('function.chrisPremades')).join(',');
            genericUtils.setProperty(sourceItemData, 'flags.midi-qol.onUseMacroName', newOnUseString);
        }
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
        let option = this.context.options.find(i => i.isSelected === true);
        let sourceItem = await fromUuid(option?.value);
        if (!sourceItem) return;
        let updatedItem = await Medkit.update(item, sourceItem, {source: option.id, version: option.version});
        this.updateContext(updatedItem);
    }
    static async _apply(event, target) {
        let item = this.itemDocument;
        let devTools = this.context?.devTools;
        if (devTools) {
            if (devTools.identifier != '') await item.setFlag('chris-premades', 'info.identifier', devTools.identifier);
            if (devTools.version != '') await item.setFlag('chris-premades', 'info.version', devTools.version);
            if (devTools.source != '') await item.setFlag('chris-premades', 'info.source', devTools.source ?? 'chris-premades');
            if (devTools.hasAnimation) await item.setFlag('chris-premades', 'info.hasAnimation', devTools.hasAnimation);
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
            if (devTools.aura != '') {
                let value = undefined;
                try {
                    value = JSON.parse(devTools.aura.replace(/'/g, '"'));
                } catch (error) {
                    ui.notifications.error('Error with Aura field, see console');
                    console.error(error);
                }
                if (value) await item.setFlag('chris-premades', 'macros.aura', value);
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
        if ((currentSource && this.context?.options?.find(i => i.isSelected && (i.id != currentSource))) || (!currentSource || currentSource === '')) {
            let selectedSource = this.context?.options.find(i => i.isSelected);
            let sourceItem = await fromUuid(selectedSource.value);
            if (this.context?.options.find(i => i.isSelected).value === null && currentSource) {
                await item.update({'flags.-=chris-premades': null}); // May need to clear more flags here for MISC/GPS integration.
            }
            if (sourceItem) {
                let option = this.context.options.find(i => i.isSelected === true);
                item = await Medkit.update(item, sourceItem, {source: option.id, version: option.version});
            }
            if (selectedSource.id != 'development') await item.setFlag('chris-premades', 'info', {source: selectedSource.id});
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
            {type: 'button', action: 'apply', label: 'DND5E.Apply', name: 'apply', icon: 'fa-solid fa-download'},
            {type: 'submit', action: 'confirm', label: 'DND5E.Confirm', name: 'confirm', icon: 'fa-solid fa-check'}
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
                } else if (event.target.tagName?.toLowerCase() === 'multi-select') {
                    // Annoyingly `event.target.type` isn't set for the above
                    this.context.category[event.target.name].configuration.find(i => i.id === event.target.id).options.forEach(i => event.target.value.includes(i.value) ? i.isSelected = true : i.isSelected = false);
                }
                this.context.category[event.target.name].configuration.forEach(i => {if (i.id === event.target.id) i.value = event.target.value;});
            }
        } else if (event.target.name.includes('devTools')) {
            let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
            if (['actor', 'item'].includes(event.target.id)) {
                this.context.devTools.midi[event.target.id] = value;
            } else this.context.devTools[event.target.id] = value;
        }
        this.render(true);
    }
    changeTab(...args) {
        let autoPos = {...this.position, height: 'auto'};
        this.setPosition(autoPos);
        super.changeTab(...args);
        let newPos = {...this.position, height: this.element.scrollHeight};
        this.setPosition(newPos);
    }
}