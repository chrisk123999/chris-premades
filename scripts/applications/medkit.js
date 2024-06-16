let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {compendiumUtils, itemUtils, genericUtils} from '../utils.js';
import * as macros from '../macros.js';

export class Medkit extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(context, itemDocument) {
        super();
        this.windowTitle = 'Chris\'s Premades Configuration: ' + context.item.name;
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
            apply: Medkit._apply,
            devToolsApply: Medkit._devToolsApply
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
            template: 'modules/chris-premades/templates/medkit-dev-tools.hbs'
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
            }
        };
        if (context.item.status === -1) context.item.status = context.item.availableAutomations.length > 0;
        if (context.item.status === 1 | context.item.status === 0) context.item.hasAutomation = true;
        context.item.statusLabel = 'CHRISPREMADES.Medkit.Status.' + context.item.status;
        if (context.item.availableAutomations.length > 1 || context.item.status === true) context.item.canApplyAutomation = true;
        if (context.item.availableAutomations.length > 0) {
            context.item.options = [];
            context.item.availableAutomations.forEach(i => {
                let label = i.source.includes('.') ? i.source : 'CHRISPREMADES.Medkit.ModuleIds.' + i.source;
                context.item.options.push({
                    label: label,
                    value: i.document.uuid,
                    isSelected: context.item.options.length === 0
                });
            });
        }
        if (macros[identifier]?.config) {
            context.category = {};
            let currentConfigs = item.flags['chris-premades']?.config;
            let configs = macros[identifier].config;
            for (let config of configs) {
                if (!context?.category?.[config.category]) {
                    context.category[config.category] = {
                        label: 'CHRISPREMADES.Medkit.Categories.' + config.category + '.Label',
                        tooltip: 'CHRISPREMADES.Medkit.Categories.' + config.category + '.Tooltip',
                        configuration: []
                    };
                }
                console.log(config);
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
                            console.log(i, config, configuration);
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
            if (macroInfo) {
                let devTools = {
                    identifier: identifier,
                    version: macroInfo.version,
                    source: 'chris-premades',
                    midi: macroInfo?.midi,
                    config: macroInfo?.config
                };
                genericUtils.setProperty(context, 'devTools', devTools);
                console.log('CPR Dev Tools | Medkit Item Macro Info: ', context.devTools);
            }
        }
        console.log(context);
        return context;
    }
    static async apply(item, sourceItem, {source, version, identifier} = {}) {
        let itemData = genericUtils.duplicate(item.toObject());
        let sourceItemData = genericUtils.duplicate(sourceItem.toObject());
        let itemType = item.type;
        sourceItemData.name = itemData.name;
        sourceItemData.system.description = itemData.system.description;
        sourceItemData.system.chatFlavor = itemData.system.chatFlavor;
        sourceItemData.system.uses = itemData.system.uses;
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
    static async _apply(event, target) {
        console.log(event, target);
        console.log(this.itemDocument);
        console.log(this.context);
        console.log(this.context.item.options.find(i => i.isSelected === true).value);
        let item = this.itemDocument;
        if (!item) return;
        let sourceItem = await fromUuid(this.context.item.options.find(i => i.isSelected === true).value);
        if (!sourceItem) return;
        let updatedItem = await Medkit.apply(item, sourceItem);
        this.updateContext(updatedItem);
    }
    static async _devToolsApply(event, target) {
        let item = this.itemDocument;
        let devTools = this.context.devTools;
        console.log(item);
        console.log(this.context.devTools.flags);
        await item.update({'flags.chris-premades.info': {identifier: devTools.identifier, version: devTools.version, source: devTools.source}});
        console.log(foundry.utils.deepClone(item));
        this.itemDocument = item;
        await this.updateContext(item);
    }
    // Add results to the object to be handled elsewhere
    static async formHandler(event, form, formData) {
        this.results = foundry.utils.expandObject(formData.object);
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
            } else if (game.settings.get('chris-premades', 'devTools')) {
                genericUtils.setProperty(tabsData, 'devTools', {
                    icon: 'fa-solid fa-wand-magic-sparkles',
                    label: 'Dev Tools',
                    tooltip: 'Tools for development, you shouldn\'t be here...',
                    cssClass: ''
                });
            }
            this.tabsData = tabsData;
        }
        context.tabs = this.tabsData;
        return context;
    }
    // Handles changes to the form, checkbox marks etc, updates the context store and forces a re-render
    async _onChangeForm(formConfig, event) {
        console.log(event.target);
        if (event.target.id === 'select-automation') {
            let options = event.target.options;
            let currentContext = this.context;
            currentContext.item.options.forEach(i => i.isSelected = false);
            currentContext.item.options[options.selectedIndex].isSelected = true;
        } else if (Object.keys(this.context.category).includes(event.target.name)) {
            console.log(this.tabsData);
            for (let key of Object.keys(this.tabsData)) {
                this.tabsData[key].cssClass = '';
            }
            this.tabsData.configure.cssClass = 'active';
            if (event.target.type === 'select-one') {
                let options = event.target.options;
                let currentContext = this.context;
                console.log(currentContext.category[event.target.name]);
                currentContext.category[event.target.name].configuration.find(i => i.id === event.target.id).options.forEach(i => i.isSelected = false);
                console.log(options.selectedIndex);
                currentContext.category[event.target.name].configuration.find(i => i.id === event.target.id).options[options.selectedIndex].isSelected = true;
            }
            console.log(event.target.name, event.target.id, event.target.type);
            this.context.category[event.target.name].configuration.forEach(i => {if (i.id === event.target.id) i.value = event.target.value;});
        }
        this.render(true);
    }
}