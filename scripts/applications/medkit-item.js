let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {compendiumUtils, itemUtils, genericUtils, constants} from '../utils.js';
import * as macros from '../macros.js';
export class ItemMedkit extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(item) {
        super({id: 'medkit-window-item'});
        this.windowTitle = 'Cauldron of Plentiful Resources Configuration: ' + item.name;
        this.position.width = 450;
        this.item = item;
        /* These are the variables we want to keep in local memory and apply when needed */
        this.flags = genericUtils.deepClone(item.flags['chris-premades']);
        this.selectedGenericFeatures = Object.keys(this.flags.config.generic);
        /* --- */
        this.medkitColor;
        this.constants = {
            canAutomate: {
                value: genericUtils.checkMedkitPermission('automate', game.userId),
                tooltip: 'CHRISPREMADES.Medkit.NoPermission'
            },
            canUpdate: {
                value: genericUtils.checkMedkitPermission('update', game.userId),
                tooltip: 'CHRISPREMADES.Medkit.NoPermission'
            },
            canConfigure: genericUtils.checkMedkitPermission('configure', game.userId),
            sources: [
                'chris-premades',
                'gambits-premades',
                'midi-item-showcase-community'
            ],
            genericFeatureMacros: Object.fromEntries(Object.entries(macros).filter(([key, value]) => value.isGenericFeature === true)),
            _isDev: game.settings.get('chris-premades', 'devTools')
        };
        this._prepared = false;
    }
    static DEFAULT_OPTIONS = {
        tag: 'form',
        form: {
            handler: ItemMedkit.formHandler,
            submitOnChange: false,
            closeOnSubmit: false,
        },
        actions: {
            update: ItemMedkit._update,
            apply: ItemMedkit._apply,
            confirm: ItemMedkit.confirm
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
            template: 'modules/chris-premades/templates/medkit-item-info.hbs'
        },
        configure: {
            template: 'modules/chris-premades/templates/medkit-item-configure.hbs',
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
    get title() {
        return this.windowTitle;
    }
    static async item(item) {
        let medkit = new ItemMedkit(item);
        await medkit.readyData();
        medkit.render(true);
    }
    /* Protected getters get the original data of the actual item, non-protected get the in-memory value stored in our duplicate flags */
    get identifier() {
        return this.flags?.info?.identifier;
    }
    get _identifier() {
        return genericUtils.getIdentifier(this.item);
    }
    get source() {
        return this.flags?.info?.source;
    }
    get _source() {
        return itemUtils.getSource(this.item);
    }
    get version() {
        return this.flags?.info?.version;
    }
    get _version() {
        return itemUtils.getVersion(this.item);
    }
    get _macro() {
        return macros[this.identifier];
    }
    /* Only expected to change when the actual item is changed upon update/apply */
    get name() {
        return this._macro ? this._macro.name : this.item.name;
    }
    get label() {
        return this._macro ? this._macro.name === this.item.name ? this.item.name : this.item.name + ' (' + this._macro.name + ')' : this.item.name;
    }
    get hasAutomation() {
        return (this.isUpToDate === 1 | this.isUpToDate === 0) ? true : false;
    }
    get status() {
        if (!this._prepared) return null; // Return null if prepareData with our async functions hasn't been called yet.
        return (this.isUpToDate === -1) ? this?.availableAutomations?.length > 0 : this.isUpToDate;
    }
    get statusLabel() {
        return 'CHRISPREMADES.Medkit.Status.' + this.status;
    }
    get canApplyAutomation() {
        if (!this._prepared) return null; // Return null if prepareData with our async functions hasn't been called yet.
        return (this.automationOptions.find(i => i.id === 'select-automation').options.length > 1 || this.status === true) ? true : false;
    }
    get medkitColor() {
        if (!this._prepared) return null; // Return null if prepareData with our async functions hasn't been called yet.
        switch (this.isUpToDate) {
            case 0: 
                return this._source === 'chris-premades' ? 'red' : 'orange';
            case 1: {
                if (this._source === 'chris-premades') {
                    return this._macro.config ? 'dodgerblue' : 'green';
                } else {
                    return 'orchid';
                }
            }
            case -1: {
                if (this.availableAutomations.length) return 'yellow';
                break;
            }
            case 2: {
                return 'dodgerblue';
            }
        }
        if (!this.constants.sources.includes(this._source) && this._source) {
            return 'pink';
        }
        return '';
    }
    get _macroConfigs() {
        return this._macro?.config ?? this.flags?.customConfig;
    }
    get _currentConfigs() {
        return this.flags?.config;
    }
    /* Data getters for tabs context */
    get automationOptions() {
        if (!this._prepared) return null; // Return null if prepareData with our async functions hasn't been called yet.
        let options = [];
        if (this.availableAutomations.length > 0) {
            options.push({
                label: 'DND5E.None',
                value: null,
                id: null,
                isSelected: (this.source && this.source != '') ? false : true,
                version: null
            });
            this.availableAutomations.forEach(automation => {
                let label;
                if (automation.source.includes('.')) { // If it has . in the source, it's from a personal compendium
                    label = game.packs.get(automation.source).metadata.label;
                } else { // If it has a source otherwise, it's from a module
                    label = 'CHRISPREMADES.Medkit.ModuleIds.' + automation.source;
                }
                options.push({
                    label: label,
                    value: automation.document.uuid,
                    id: automation.source,
                    isSelected: this.source === automation.source,
                    version: automation.version
                });
            });
        }
        if (this.constants._isDev) options.push({
            label: 'Development',
            value: 'development',
            id: 'development',
            isSelected: this.source === 'development',
        });
        return [
            {
                id: 'select-automation',
                label: 'CHRISPREMADES.Medkit.SelectedAutomation',
                tooltip: this.constants.canAutomate.tooltip,
                disabled: this.constants.canAutomate.value ? false : true,
                value: this.source ?? null,
                flag: {
                    key: 'info.source',
                    value: 'id'
                },
                options: options
            }
        ];
    }
    get hasConfigurationOptions() {
        return this._macroConfigs ? true : false;
    }
    get configurationOptions() {
        if (!this._macroConfigs) return false;
        return this._macroConfigs.reduce((configurationOptions, config) => {
            if (!configurationOptions[config.category]) {
                configurationOptions[config.category] = {
                    label: 'CHRISPREMADES.Medkit.Categories.' + config.category + '.Label',
                    tooltip: 'CHRISPREMADES.Medkit.Categories.' + config.category + '.Tooltip',
                    configOptions: []
                };
            }
            let configOption = {
                label: config.label,
                name: config.category,
                id: config.value,
                flag: {
                    key: 'config.' + config.value,
                    value: 'value'
                },
                value: this._currentConfigs?.[config.value] ?? config.default,
                i18nOption: config?.i18nOption ? genericUtils.translate(config.i18nOption) : false
            };
            if ((!this.constants.canConfigure) || (config?.homebrew && !genericUtils.checkMedkitPermission('homebrew', game.userId))) {
                configOption.isDisabled = true;
                configOption.tooltip = 'CHRISPREMADES.Medkit.NoPermission';
            }
            switch (config.type) {
                case 'checkbox': {
                    configOption.isCheckbox = true;
                    configOption.isChecked = config.value;
                    configOption.flag.value = 'checked';
                    break;
                }
                case 'file': {
                    configOption.isFile = true;
                    configOption.type = config?.fileType ?? 'any';
                    break;
                }
                case 'text': {
                    configOption.isText = true;
                    break;
                }
                case 'select': {
                    configOption.isSelect = true;
                    config.options = config.options instanceof Function ? config.options() : config.options;
                    config.options.forEach(i => {
                        if (!configOption?.options) genericUtils.setProperty(configOption, 'options', []);
                        if (i.requiredModules?.find(j => !game.modules.get(j)?.active)) return;
                        configOption.options.push({
                            label: i.label,
                            value: i.value,
                            isSelected: i.value === (this._currentConfigs?.[config.value] ?? config.default)
                        });
                    });
                    break;
                }
                case 'select-many': {
                    configOption.isSelectMany = true;
                    config.options = config.options instanceof Function ? config.options() : config.options;
                    config.options.forEach(i => {
                        if (!configOption?.options) genericUtils.setProperty(configOption, 'options', []);
                        if (i.requiredModules?.find(j => !game.modules.get(j)?.active)) return;
                        configOption.options.push({
                            label: i.label,
                            value: i.value,
                            isSelected: (this._currentConfigs?.[config.value] ?? config.default).includes(i.value)
                        });
                    });
                    break;
                }
            }
            configurationOptions[config.category].configOptions.push(configOption);
            return configurationOptions;
        }, {});
    }
    get hasGenericFeaturesOptions() {
        return this.item?.actor?.type === 'npc' ? true : false;
    }
    get genericFeaturesOptions () {
        if (this.item?.actor?.type != 'npc') return false;
        console.log(this.constants.genericFeatureMacros);
        return [
            {
                id: 'select-generic-monster-features',
                label: 'CHRISPREMADES.Medkit.Tabs.GenericFeatures.Monster.Select.Label',
                tooltip: this.constants.canAutomate.value ? 'CHRISPREMADES.Medkit.Tabs.GenericFeatures.Monster.Select.Tooltip' : this.constants.canAutomate.tooltip,
                disabled: !this.constants.canAutomate.value,
                value: genericUtils.duplicate(this.selectedGenericFeatures),
                options: Object.entries(this.constants.genericFeatureMacros).map(([key, value]) => {
                    return {
                        label: value.translation ? genericUtils.translate(value.translation) : value.name,
                        value: key,
                        isSelected: this.selectedGenericFeatures.includes(key) ? true : false
                    };
                }).sort((a, b) => a.label.localeCompare(b.label, 'en', {'sensitivity': 'base'}))
            }
        ];
    }
    get genericFeaturesConfigs() {
        Object.keys(this.flags?.config?.generic).forEach(i => {if (!this.selectedGenericFeatures.includes(i)) delete this.flags.config.generic[i];});
        return this.selectedGenericFeatures.reduce((configs, key) => {
            let genericFeature = this.constants.genericFeatureMacros[key];
            let value = this.flags?.config?.generic?.[key];
            configs[key] = {
                id: key,
                label: genericFeature.name,
                configOptions: genericFeature.genericConfig.map(configBase => {
                    let config = {
                        label: configBase.label,
                        id: configBase.value,
                        value: value?.[configBase.value] ?? configBase.default,
                        disabled: !this.constants.canAutomate.value,
                        flag: {
                            key: 'config.generic.' + key + '.' + configBase.value,
                            value: 'value'
                        }
                    };
                    switch (configBase.type) {
                        case 'checkbox': { 
                            config.isChecked = config.value === true ? true : false;
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
                    return config;
                })
            };
            return configs;
        }, {});
    }
    get hasDevToolsOptions() {
        return this.constants._isDev;
    }
    get devToolsOptions() {
        let automationInfo = [
            {
                id: 'identifier',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Identifier',
                value: this.identifier,
                isText: true,
                flag: {
                    key: 'info.identifier',
                    value: 'value'
                }
            },
            {
                id: 'version',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Version',
                value: this.version,
                isText: true,
                flag: {
                    key: 'info.version',
                    value: 'value'
                }
            },
            {
                id: 'source',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Source',
                value: this.source,
                isText: true,
                flag: {
                    key: 'info.source',
                    value: 'value'
                }
            },
            {
                id: 'hasAnimation',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.HasAnimation',
                value: this.flags?.info?.hasAnimation,
                isCheckbox: true,
                isChecked: this.flags?.info?.hasAnimation,
                flag: {
                    key: 'info.hasAnimation',
                    value: 'value'
                }
            }
        ];
        let macroInfo = [
            {
                id: 'item',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.MidiItem',
                value: JSON?.stringify(this.flags?.['chris-premades']?.macros?.midi?.item),
                isText: true,
                flag: {
                    key: 'macros.midi.item',
                    value: 'value'
                }
            },
            {
                id: 'actor',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.MidiActor',
                value: JSON?.stringify(this.flags?.['chris-premades']?.macros?.midi?.actor),
                isText: true,
                flag: {
                    key: 'macros.midi.actor',
                    value: 'value'
                }
            },
            {
                id: 'aura',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Aura',
                value: JSON?.stringify(this.flags?.['chris-premades']?.macros?.aura),
                isText: true,
                flag: {
                    key: 'macros.aura',
                    value: 'value'
                }
            },
            {
                id: 'combat',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Combat',
                value: JSON?.stringify(this.flags?.['chris-premades']?.macros?.combat),
                isText: true,
                flag: {
                    key: 'macros.combat',
                    value: 'value'
                }
            },
            {
                id: 'movement',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Movement',
                value: JSON?.stringify(this.flags?.['chris-premades']?.macros?.movement),
                isText: true,
                flag: {
                    key: 'macros.movement',
                    value: 'value'
                }
            },
            {
                id: 'check',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Check',
                value: JSON?.stringify(this.flags?.['chris-premades']?.macros?.check),
                isText: true,
                flag: {
                    key: 'macros.check',
                    value: 'value'
                }
            },
            {
                id: 'save',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Save',
                value: JSON?.stringify(this.flags?.['chris-premades']?.macros?.save),
                isText: true,
                flag: {
                    key: 'macros.save',
                    value: 'value'
                }
            },
            {
                id: 'skill',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Skill',
                value: JSON?.stringify(this.flags?.['chris-premades']?.macros?.skill),
                isText: true,
                flag: {
                    key: 'macros.skill',
                    value: 'value'
                }
            },
            {
                id: 'death',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Death',
                value: JSON?.stringify(this.flags?.['chris-premades']?.macros?.death),
                isText: true,
                flag: {
                    key: 'macros.death',
                    value: 'value'
                }
            },
            {
                id: 'rest',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Rest',
                value: JSON?.stringify(this.flags?.['chris-premades']?.macros?.rest),
                isText: true,
                flag: {
                    key: 'macros.rest',
                    value: 'value'
                }
            },
            {
                id: 'equipment',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Equipment',
                value: this.flags?.['chris-premades']?.equipment?.identifier,
                isText: true,
                flag: {
                    key: 'equipment.identifier',
                    value: 'value'
                }
            }
        ];
        if (!this._devToolsOptions && this.constants.devTools) {
            this._devToolsOptions = {
                identifier: this.item.flags?.['chris-premades']?.info?.identifier ?? '',
                version: this.item.flags?.['chris-premades']?.info?.version ?? this._macro?.version ?? '',
                source: this.item.flags?.['chris-premades']?.info?.source ?? '',
                hasAnimation: this.item.flags?.['chris-premades']?.info?.hasAnimation ?? this._macro?.hasAnimation ?? false,
                midi: {
                    item: JSON?.stringify(this.item.flags?.['chris-premades']?.macros?.midi?.item) ?? '',
                    actor: JSON?.stringify(this.item.flags?.['chris-premades']?.macros?.midi?.actor) ?? '',
                },
                aura: JSON?.stringify(this.item.flags?.['chris-premades']?.macros?.aura) ?? '',
                combat: JSON?.stringify(this.item.flags?.['chris-premades']?.macros?.combat) ?? '',
                movement: JSON?.stringify(this.item.flags?.['chris-premades']?.macros?.movement) ?? '',
                rest: JSON?.stringify(this.item.flags?.['chris-premades']?.macros?.rest) ?? '',
                equipment: this.item.flags?.['chris-premades']?.equipment?.identifier ?? '',
                skill: JSON?.stringify(this.item.flags?.['chris-premades']?.macros?.skill) ?? '',
                save: JSON?.stringify(this.item.flags?.['chris-premades']?.macros?.save) ?? '',
                check: JSON?.stringify(this.item.flags?.['chris-premades']?.macros?.check) ?? '',
            };
        }
        return this._devToolsOptions ?? false;
    }
    get tabsData() {
        let tabsData = {
            info: {
                icon: 'fa-solid fa-hammer',
                label: 'CHRISPREMADES.Medkit.Tabs.Info.Label',
                tooltip: 'CHRISPREMADES.Medkit.Tabs.Info.Tooltip',
                cssClass: (this.activeTab === 'info') || (this.activeTab === undefined) ? 'active' : ''
            }
        };
        if (this.hasConfigurationOptions) {
            genericUtils.setProperty(tabsData, 'configure', {
                icon: 'fa-solid fa-wrench',
                label: 'CHRISPREMADES.Medkit.Tabs.Configuration.Label',
                tooltip: 'CHRISPREMADES.Medkit.Tabs.Configuration.Tooltip',
                cssClass: this.activeTab === 'configure' ? 'active' : ''
            });
        }
        if (this.hasGenericFeaturesOptions) {
            genericUtils.setProperty(tabsData, 'genericFeatures', {
                icon: 'fa-solid fa-toolbox',
                label: 'CHRISPREMADES.Medkit.Tabs.GenericFeatures.Label',
                tooltip: 'CHRISPREMADES.Medkit.Tabs.GenericFeatures.Tooltip',
                cssClass: this.activeTab === 'genericFeatures' ? 'active' : ''
            });
        } 
        if (game.settings.get('chris-premades', 'devTools')) {
            genericUtils.setProperty(tabsData, 'devTools', {
                icon: 'fa-solid fa-wand-magic-sparkles',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Label',
                tooltip: 'CHRISPREMADES.Medkit.Tabs.DevTools.Tooltip',
                cssClass: this.activeTab === 'devTools' ? 'active' : ''
            });
        }
        return tabsData;
    }
    get activeTab() {
        return this._activeTab;
    }
    set activeTab(tab) {
        this._activeTab = tab;
    }
    async readyData() {
        this.isUpToDate = await itemUtils.isUpToDate(this.item);
        this.availableAutomations = await compendiumUtils.getAllAutomations(this.item, {identifier: this.item?.actor?.flags['chris-premades']?.info?.identifier});
        this._prepared = true;
    }
    static async update(item, sourceItem, {source, version, identifier} = {}) { // --- Need to fix up this to use new paths
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
    static async _update(event, target) { // --- Need to fix up this to use new paths
        let item = this.itemDocument;
        if (!item) return;
        let option = this.context.options.find(i => i.isSelected === true);
        let sourceItem = await fromUuid(option?.value);
        if (!sourceItem) return;
        let updatedItem = await ItemMedkit.update(item, sourceItem, {source: option.id, version: option.version});
        this.updateContext(updatedItem);
    }
    static async _apply(event, target) { // --- Need to fix up this to use new paths
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
                        if (genericFeatures.configs) {
                            Object.values(genericFeatures.configs)?.forEach(async option => {
                                let index = flagValue.indexOf(option.id);
                                if (index > -1) {
                                    if (flagValue.length === 1) await item.unsetFlag('chris-premades', 'macros.' + key + '.' + flagKey);
                                    else {
                                        flagValue.splice(index, 1);
                                        await item.setFlag('chris-premades', 'macros.' + key + '.' + flagKey, flagValue);
                                    }
                                }
                            });
                        }
                    });
                } else {
                    Object.values(genericFeatures.configs)?.forEach(async option => {
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
                let macroInfo = macros[i];
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
                    item = await ItemMedkit.update(item, sourceItem, {source: option.id, version: option.version});
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
        await ItemMedkit._apply.bind(this)(event, target);
        this.close();
    }
    async updateContext(item) { // -- Need to get rid of
        let newContext = await ItemMedkit.createContext(item);
        this.context = newContext;
        this.render(true);
    }
    async _prepareContext(options) {
        let context = {
            label: this.label,
            statusLabel: this.statusLabel,
            medkitColor: this.medkitColor,
            info: {
                hasAutomation: this.hasAutomation,
                isUpToDate: this.isUpToDate,
                canUpdate: this.constants.canUpdate,
                canApplyAutomation: this.canApplyAutomation,
                canAutomate: this.constants.canAutomate,
                automationOptions: this.automationOptions
            },
            configure: {
                configurationOptions: this.configurationOptions
            },
            genericFeatures: {
                genericFeaturesOptions: this.genericFeaturesOptions,
                genericFeaturesConfigs: this.genericFeaturesConfigs
            },
            devTools: {
                devToolsOptions: this.devToolsOptions
            },
            buttons: [
                {type: 'button', action: 'apply', label: 'DND5E.Apply', name: 'apply', icon: 'fa-solid fa-download'},
                {type: 'submit', action: 'confirm', label: 'DND5E.Confirm', name: 'confirm', icon: 'fa-solid fa-check'}
            ],
            tabs: this.tabsData
        };
        console.log(context);
        return context;
    }
    // Handles changes to the form, checkbox marks etc, updates the context store and forces a re-render
    // ---- Need to fix up this to use new paths
    async _onChangeForm(formConfig, event) { // Clean this up to get the relevent part of the context in the least ass-backwards way possible (be brave with jquery and keep more attributes on the elements)
        let currentTabId = this.element.querySelector('.item.active').getAttribute('data-tab');
        this.activeTab = currentTabId;
        let dataOptions = event.target.closest('[data-options]')?.getAttribute('data-options');
        let dataCategory = event.target.closest('[data-category]')?.getAttribute('data-category');
        let inputType = event.target.type ?? event.target.tagName.toLowerCase();
        console.log(dataOptions, dataCategory, inputType);
        console.log(this[dataOptions]);
        let optionGroup = dataCategory ? this[dataOptions][dataCategory].configOptions : dataOptions ? this[dataOptions] : this[event.target.id];
        console.log(optionGroup);
        let option;
        option = optionGroup.find(i => (i.id ?? null) === event.target.id);
        switch (inputType) { // these should be setting a copy of the configs
            case 'checkbox': {
                option.value = event.target.checked;
                break;
            }
            case 'text':
            case 'number': 
            case 'select-one':
            case 'multi-select': {
                option.value = event.target.value;
            }
        }
        if (option?.flag) await genericUtils.setProperty(this.flags, option.flag.key, option.flag.value === 'id' ? event.target.querySelector('option:checked').id : option.value);
        if (event.target.id === 'select-generic-monster-features') this.selectedGenericFeatures = option.value;
        let autoPos = {...this.position, height: 'auto'};
        this.setPosition(autoPos);
        this.render(true);
        console.log(this.flags);
    }
    changeTab(...args) {
        let autoPos = {...this.position, height: 'auto'};
        this.setPosition(autoPos);
        super.changeTab(...args);
        let newPos = {...this.position, height: this.element.scrollHeight};
        this.setPosition(newPos);
    }
}