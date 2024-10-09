let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {compendiumUtils, itemUtils, genericUtils, constants} from '../utils.js';
import * as macros from '../macros.js';
import {custom} from '../events/custom.js';
export class Medkit extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(context, itemDocument) {
        super({id: 'medkit-window-item'});
        this.windowTitle = 'Cauldron of Plentiful Resources Configuration: ' + context.name;
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
        genericFeatures: {
            template: 'modules/chris-premades/templates/medkit-item-generic-features.hbs',
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
        let isUpToDate = await itemUtils.isUpToDate(item);
        let context = {
            identifier: identifier,
            name: custom.getMacro(identifier) ? custom.getMacro(identifier).name : item.name,
            label: custom.getMacro(identifier) ? custom.getMacro(identifier).name === item.name ? item.name : item.name + ' (' + custom.getMacro(identifier).name + ')' : item.name,
            version: itemUtils.getVersion(item),
            source: itemUtils.getSource(item),
            isUpToDate: isUpToDate,
            availableAutomations: await compendiumUtils.getAllAutomations(item, {identifier: item?.actor?.flags['chris-premades']?.info?.identifier}),
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
        /** Info Tab */
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
                    if (custom.getMacro(identifier).config) {
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
                let availableItem = await compendiumUtils.getPreferredAutomation(item, {identifier: item?.actor?.flags['chris-premades']?.info?.identifier});
                if (availableItem) context.medkitColor = 'yellow';
                break;
            }
            case 2: {
                context.medkitColor = 'dodgerblue';
            }
        }
        if (!sources.includes(context.source) && context.source) {
            context.medkitColor = 'pink';
        }
        /** Config Tab */
        let configs = custom.getMacro(identifier)?.config;
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
                            if (i.requiredModules?.find(j => !game.modules.get(j)?.active)) return;
                            configuration.options.push({
                                label: i.label,
                                value: i.value,
                                isSelected: i.value === (currentConfigs?.[config.value] ?? config.default)
                            });
                        });
                        break;
                    }
                    case 'select-many': {
                        genericUtils.setProperty(configuration, 'isSelectMany', true);
                        config.options = config.options instanceof Function ? config.options() : config.options;
                        config.options.forEach(i => {
                            if (!configuration?.options) genericUtils.setProperty(configuration, 'options', []);
                            if (i.requiredModules?.find(j => !game.modules.get(j)?.active)) return;
                            configuration.options.push({
                                label: i.label,
                                value: i.value,
                                isSelected: (currentConfigs?.[config.value] ?? config.default).includes(i.value)
                            });
                        });
                        break;
                    }
                }
                context.category[config.category].configuration.push(configuration);
            }
        }
        /** Generic Monster Features Tab */
        if (item?.actor?.type === 'npc') {
            let currentGenericFeatures = item.flags['chris-premades']?.config?.generic ?? {};
            let currentGenericFeaturesKeys = Object.keys(currentGenericFeatures) ?? '';
            let genericFeatures = Object.fromEntries(Object.entries(macros).filter(([key, value]) => value.isGenericFeature === true));
            context.genericFeatures = {
                label: 'CHRISPREMADES.Medkit.Tabs.GenericFeatures.Monster.Select.Label',
                tooltip: 'CHRISPREMADES.Medkit.Tabs.GenericFeatures.Monster.Select.Tooltip'
            };
            context.genericFeatures.options = Object.entries(genericFeatures).map(([key, value]) => {
                return {
                    label: value.translation ? genericUtils.translate(value.translation) : value.name,
                    value: key,
                    isSelected: currentGenericFeaturesKeys.includes(key) ? true : false
                };
            }).sort((a, b) => a.label.localeCompare(b.label, 'en', {'sensitivity': 'base'}));
            if (currentGenericFeaturesKeys.length) {
                context.genericFeatures.configs = Object.entries(currentGenericFeatures).reduce((configs, [key, value]) => {
                    configs[key] = {
                        label: context.genericFeatures.options.find(i => i.value === key).label,
                        id: key,
                        options: macros[key].genericConfig.reduce((options, configBase) => {   
                            let config = {
                                label: configBase.label,
                                id: configBase.value,
                                value: value[configBase.value],
                            };
                            switch (configBase.type) {
                                case 'checkbox': { 
                                    config.isChecked = value[configBase.value] === true ? true : false;
                                    config.isCheckbox = true;
                                    break;
                                }
                                case 'text': {
                                    config.isText = true;
                                    break;
                                }
                                case 'number': {
                                    config.isNumber = true;
                                    break;
                                }
                                case 'select': {
                                    config.isSelect = true;
                                    config.options = (configBase.options instanceof Function ? configBase.options() : configBase.options).map(i => {i.isSelected = i.value === config?.value; return i;});
                                    break;
                                }
                                case 'creatureTypes': {
                                    config.isSelectMany = true;
                                    config.options = constants.creatureTypeOptions().map(i => ({
                                        label: i.label, 
                                        value: i.value,
                                        isSelected: config?.value?.includes(i.value) 
                                    }));
                                    break;
                                }
                                case 'damageTypes': {
                                    config.isSelectMany = true;
                                    config.options = Object.entries(CONFIG.DND5E.damageTypes).filter(([key, value]) => !key.toLowerCase().includes('none')).map(([key, value]) => ({
                                        label: value.label,
                                        value: key,
                                        isSelected: config?.value?.includes(key) 
                                    }));
                                    break;
                                }
                                case 'abilities': {
                                    config.isSelectMany = true;
                                    config.options = Object.entries(CONFIG.DND5E.abilities).map(([key, value]) => ({
                                        label: value.label,
                                        value: key,
                                        isSelected: config?.value?.includes(key) 
                                    }));
                                    break;
                                }
                                case 'skills': {
                                    config.isSelectMany = true;
                                    config.options = Object.entries(CONFIG.DND5E.skills).map(([key, value]) => ({
                                        label: value.label,
                                        value: key,
                                        isSelected: config?.value?.includes(key) 
                                    }));
                                    break;
                                }
                            }
                            options.push(config);
                            return options;
                        }, [])
                    };
                    return configs;
                }, {});
            } 
        }
        /** Dev Tools Tab */
        let isDev = game.settings.get('chris-premades', 'devTools');
        if (isDev) {
            context.options.push({
                label: 'Development',
                value: 'development',
                id: 'development',
                isSelected: context?.source === 'development' ? true : context?.source ? false : true,
            });
            let macroInfo = custom.getMacro(identifier);
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
                combat: JSON?.stringify(item.flags?.['chris-premades']?.macros?.combat) ?? '',
                movement: JSON?.stringify(item.flags?.['chris-premades']?.macros?.movement) ?? '',
                rest: JSON?.stringify(item.flags?.['chris-premades']?.macros?.rest) ?? '',
                equipment: item.flags?.['chris-premades']?.equipment?.identifier ?? '',
                skill: JSON?.stringify(item.flags?.['chris-premades']?.macros?.skill) ?? '',
                save: JSON?.stringify(item.flags?.['chris-premades']?.macros?.save) ?? '',
                check: JSON?.stringify(item.flags?.['chris-premades']?.macros?.check) ?? '',
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
        let onUseFlag = genericUtils.getProperty(sourceItemData, 'flags.midi-qol.onUseMacroName');
        if (!onUseFlag) genericUtils.setProperty(sourceItemData, 'flags.miid-qol.-=onUseMacroName', null);
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
        let macrosFlag = genericUtils.getProperty(sourceItemData, 'flags.chris-premades.macros');
        if (!macrosFlag) genericUtils.setProperty(sourceItemData, 'flags.chris-premades.-=macros', null);
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
        let {devTools, category, genericFeatures} = this.context;
        if (devTools) {
            if (devTools.identifier != '') await item.setFlag('chris-premades', 'info.identifier', devTools.identifier);
            if (devTools.version != '') await item.setFlag('chris-premades', 'info.version', devTools.version);
            if (devTools.source != '') await item.setFlag('chris-premades', 'info.source', devTools.source ?? 'chris-premades');
            if (devTools.hasAnimation) await item.setFlag('chris-premades', 'info.hasAnimation', devTools.hasAnimation);
            let macroFields = ['midi.item', 'midi.actor', 'aura', 'combat', 'movement', 'rest', 'save', 'skill', 'check'];
            for (let field of macroFields) {
                let currValue = genericUtils.getProperty(devTools, field);
                if (currValue !== '') {
                    let value = undefined;
                    try {
                        value = JSON.parse(currValue.replace(/'/g, '"'));
                    } catch (error) {
                        ui.notifications.error('Error with ' + field.split('.').map(i => i.capitalize()).join('.') + ' field, see console');
                        console.error(error);
                    }
                    if (value) await item.setFlag('chris-premades', 'macros.' + field, value);
                } else {
                    await item.unsetFlag('chris-premades', 'macros.' + field);
                }
            }
            if (devTools.equipment != '') {
                await item.setFlag('chris-premades', 'equipment', {identifier: devTools.equipment});
            } else {
                await item.unsetFlag('chris-premades', 'equipment');
            }
        }
        if (category) {
            let configs = {};
            for (let i of Object.values(category)) {
                for (let j of i.configuration) {
                    configs[j.id] = j.value;
                }
            }
            await item.setFlag('chris-premades', 'config', configs);
        }
        if (genericFeatures) { // This whole section needs help 
            await item.unsetFlag('chris-premades', 'config.generic');
            // Remove ALL generic flags from the macros flags
            let itemFlags = item.flags['chris-premades'];
            if (itemFlags?.macros) Object.entries(itemFlags.macros).forEach(async ([key, value]) => {
                if (value instanceof Object && !(value instanceof Array)) {
                    Object.entries(value).forEach(async ([flagKey, flagValue]) => {
                        Object.values(genericFeatures.configs ?? {})?.forEach(async option => {
                            let index = flagValue.indexOf(option.id);
                            if (index > -1) {
                                if (flagValue.length === 1) await item.unsetFlag('chris-premades', 'macros.' + key + '.' + flagKey);
                                else {
                                    flagValue.splice(index, 1);
                                    await item.setFlag('chris-premades', 'macros.' + key + '.' + flagKey, flagValue);
                                }
                            }
                        });
                    });
                } else {
                    Object.values(genericFeatures.configs ?? {})?.forEach(async option => {
                        let index = value.indexOf(option.id);
                        if (index > -1) {
                            if (value.length === 1) await item.unsetFlag('chris-premades', 'macros.' + key);
                            else {
                                value.splice(index, 1);
                                await item.setFlag('chris-premades', 'macros.' + key, value);
                            }
                        }
                    });
                }
            });
            let genericConfigs = genericFeatures.options.reduce((genericConfigs, option) => {
                if (option.isSelected) genericConfigs[option.value] = (genericFeatures?.configs?.[option.value]?.options ?? macros?.[option.value]?.genericConfig)?.reduce((config, option) => {
                    config[option.default === undefined ? option.id : option.value] = option.default ?? option.value;
                    return config;
                }, {});
                return genericConfigs;
            }, {});
            if (Object.keys(genericConfigs).length) await item.setFlag('chris-premades', 'config.generic', genericConfigs);
            let macroUpdates = {};
            Object.keys(genericConfigs).forEach(async i => {
                let macroInfo = custom.getMacro(i);
                let macroFields = ['midi.actor', 'midi.item', 'aura', 'combat', 'movement', 'rest', 'save', 'skill', 'check'];
                for (let macroField of macroFields) {
                    if (genericUtils.getProperty(macroInfo, macroField)) {
                        macroUpdates[macroField] = (macroUpdates[macroField] ?? item.flags['chris-premades']?.macros?.[macroField] ?? []).concat([i]);
                    }
                }
            });
            if (Object.keys(macroUpdates).length) {
                let trueUpdates = Object.fromEntries(Object.entries(macroUpdates).map(i => ['flags.chris-premades.macros.' + i[0], i[1]]));
                await genericUtils.update(item, trueUpdates);
            }
        }
        let currentSource = item?.flags?.['chris-premades']?.info?.source;
        if ((currentSource && this.context?.options?.find(i => i.isSelected && (i.id != currentSource))) || (!currentSource || currentSource === '')) {
            let selectedSource = this.context?.options.find(i => i.isSelected);
            if (selectedSource) {
                let sourceItem = await fromUuid(selectedSource.value);
                if (sourceItem) {
                    let option = this.context.options.find(i => i.isSelected === true);
                    item = await Medkit.update(item, sourceItem, {source: option.id, version: option.version});
                }
                if (selectedSource.id != 'development') await item.setFlag('chris-premades', 'info', {source: selectedSource.id});
            } else if (currentSource) {
                await item.update({'flags.-=chris-premades': null}); // May need to clear more flags here for MISC/GPS integration.
            }
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
            if (context?.genericFeatures) {
                genericUtils.setProperty(tabsData, 'genericFeatures', {
                    icon: 'fa-solid fa-toolbox',
                    label: 'CHRISPREMADES.Medkit.Tabs.GenericFeatures.Label',
                    tooltip: 'CHRISPREMADES.Medkit.Tabs.GenericFeatures.Tooltip',
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
    async _onChangeForm(formConfig, event) { // Clean this up to get the relevent part of the context in the least ass-backwards way possible (be brave with jquery and keep more attributes on the elements)
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
        } else if (event.target.name === 'monster-features') {
            this.context.genericFeatures.options.forEach(i => i.isSelected = event.target.value.includes(i.value) ? true : false);
        } else if (event.target?.parentElement?.getAttribute('data-context') === 'generic-features') {
            let option = this.context.genericFeatures.configs[event.target.parentElement.getAttribute('data-id')].options.find(i => i.id === event.target.id);
            switch (event.target.type) {
                case 'checkbox': {
                    option.isChecked = event.target.checked;
                    option.value = event.target.checked;
                    break;
                }
                case 'text':
                case 'number': {
                    option.value = event.target.value;
                    break;
                }
                case 'select-one': {
                    option.options.forEach(i => event.target.value.includes(i.value) ? i.isSelected = true : i.isSelected = false);
                    option.value = event.target.value;
                    break;
                }
                default: {
                    if (event.target.tagName?.toLowerCase() === 'multi-select') {
                        option.options.forEach(i => event.target.value.includes(i.value) ? i.isSelected = true : i.isSelected = false);
                        option.value = event.target.value;
                    }
                    break;
                }
            }
        } else if (event.target.name.includes('devTools')) {
            let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
            if (['actor', 'item'].includes(event.target.id)) {
                this.context.devTools.midi[event.target.id] = value;
            } else this.context.devTools[event.target.id] = value;
        }
        let autoPos = {...this.position, height: 'auto'};
        this.setPosition(autoPos);
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