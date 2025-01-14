let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {compendiumUtils, itemUtils, genericUtils, constants} from '../utils.js';
import * as macros from '../macros.js';
import {custom} from '../events/custom.js';
export class ItemMedkit extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(item) {
        super({id: 'medkit-window-item'});
        this.windowTitle = 'Cauldron of Plentiful Resources Configuration: ' + item.name;
        this.position.width = 450;
        this.item = item;
        /* These are the variables we want to keep in local memory and apply when needed */
        this.flags = genericUtils?.deepClone(item?.flags['chris-premades']) ?? {};
        this.selectedGenericFeatures = Object.keys(this.flags?.config?.generic ?? {});
        this.selectedSource = this.flags?.info?.source;
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
            template: 'modules/chris-premades/templates/medkit-item-dev-tools.hbs',
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
    static async itemUpdate(item) {
        let medkit = new ItemMedkit(item);
        await medkit.readyData();
        let source = medkit.availableAutomations.find(i => i.source === medkit._source) ?? medkit.availableAutomations[0];
        if (!source) return;
        await ItemMedkit.update(item, source.document, {source: source.source, version: source.version, identifier: genericUtils.getIdentifier(item)});
        return item;
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
        return custom.getMacro(this.identifier);
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
        return ((this.automationOptions.find(i => i.id === 'select-automation').options.length > 1) || (this.status === true) || this.constants._isDev) ? true : false;
    }
    get medkitColor() {
        if (!this._prepared) return null; // Return null if prepareData with our async functions hasn't been called yet.
        switch (this.isUpToDate) {
            case 0: 
                return this._source === 'chris-premades' ? 'red' : 'orange';
            case 1: {
                if (this._source === 'chris-premades') {
                    return this._macro?.config ? 'dodgerblue' : 'green';
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
        let options = [{
            label: 'DND5E.None',
            value: null,
            id: null,
            isSelected: (this.selectedSource && this.selectedSource != '') ? false : true,
            version: null,
        }];
        if (this.availableAutomations.length > 0) {
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
                    isSelected: this.selectedSource === automation.source,
                    version: automation.version,
                });
            });
        }
        if (this.constants._isDev) options.push({
            label: 'Development',
            value: 'development',
            id: 'development',
            isSelected: this.selectedSource === 'development',
        });
        return [
            {
                id: 'select-automation',
                label: 'CHRISPREMADES.Medkit.SelectedAutomation',
                tooltip: this.constants.canAutomate.tooltip,
                disabled: this.constants.canAutomate.value ? false : true,
                value: this.selectedSource ?? null,
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
        Object.keys(this.flags?.config?.generic ?? {}).forEach(i => {if (!this.selectedGenericFeatures.includes(i)) delete this.flags.config.generic[i];});
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
                value: JSON?.stringify(this.flags?.macros?.midi?.item),
                placeholder: '[&quot;macroNameOne&quot;, &quot;macroNameTwo&quot;]',
                isText: true,
                flag: {
                    key: 'macros.midi.item',
                    value: 'array'
                }
            },
            {
                id: 'actor',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.MidiActor',
                value: JSON?.stringify(this.flags?.macros?.midi?.actor),
                placeholder: '[&quot;macroNameOne&quot;, &quot;macroNameTwo&quot;]',
                isText: true,
                flag: {
                    key: 'macros.midi.actor',
                    value: 'array'
                }
            },
            {
                id: 'aura',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Aura',
                value: JSON?.stringify(this.flags?.macros?.aura),
                placeholder: '[&quot;macroNameOne&quot;, &quot;macroNameTwo&quot;]',
                isText: true,
                flag: {
                    key: 'macros.aura',
                    value: 'array'
                }
            },
            {
                id: 'combat',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Combat',
                value: JSON?.stringify(this.flags?.macros?.combat),
                placeholder: '[&quot;macroNameOne&quot;, &quot;macroNameTwo&quot;]',
                isText: true,
                flag: {
                    key: 'macros.combat',
                    value: 'array'
                }
            },
            {
                id: 'movement',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Movement',
                value: JSON?.stringify(this.flags?.macros?.movement),
                placeholder: '[&quot;macroNameOne&quot;, &quot;macroNameTwo&quot;]',
                isText: true,
                flag: {
                    key: 'macros.movement',
                    value: 'array'
                }
            },
            {
                id: 'check',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Check',
                value: JSON?.stringify(this.flags?.macros?.check),
                placeholder: '[&quot;macroNameOne&quot;, &quot;macroNameTwo&quot;]',
                isText: true,
                flag: {
                    key: 'macros.check',
                    value: 'array'
                }
            },
            {
                id: 'save',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Save',
                value: JSON?.stringify(this.flags?.macros?.save),
                placeholder: '[&quot;macroNameOne&quot;, &quot;macroNameTwo&quot;]',
                isText: true,
                flag: {
                    key: 'macros.save',
                    value: 'array'
                }
            },
            {
                id: 'skill',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Skill',
                value: JSON?.stringify(this.flags?.macros?.skill),
                placeholder: '[&quot;macroNameOne&quot;, &quot;macroNameTwo&quot;]',
                isText: true,
                flag: {
                    key: 'macros.skill',
                    value: 'array'
                }
            },
            {
                id: 'death',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Death',
                value: JSON?.stringify(this.flags?.macros?.death),
                placeholder: '[&quot;macroNameOne&quot;, &quot;macroNameTwo&quot;]',
                isText: true,
                flag: {
                    key: 'macros.death',
                    value: 'array'
                }
            },
            {
                id: 'rest',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Rest',
                value: JSON?.stringify(this.flags?.macros?.rest),
                placeholder: '[&quot;macroNameOne&quot;, &quot;macroNameTwo&quot;]',
                isText: true,
                flag: {
                    key: 'macros.rest',
                    value: 'array'
                }
            },
            {
                id: 'equipment',
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.Equipment',
                value: this.flags?.equipment?.identifier,
                placeholder: 'string',
                isText: true,
                flag: {
                    key: 'equipment.identifier',
                    value: 'value'
                }
            }
        ];
        return {
            automationInfo: {
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.AutomationInfo',
                id: 'automationInfo',
                configOptions: automationInfo
            },
            macroInfo: {
                label: 'CHRISPREMADES.Medkit.Tabs.DevTools.MacroInfo',
                id: 'macroInfo',
                configOptions: macroInfo
            }
        };
    }
    /* Tabs data and keeping the active tab */
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
    /* Our async function to call before rendering so that we can fetch documents from compendiums */
    async readyData() {
        this.isUpToDate = await itemUtils.isUpToDate(this.item);
        this.availableAutomations = await compendiumUtils.getAllAutomations(this.item, {identifier: this.item?.actor?.flags['chris-premades']?.info?.identifier});
        this._prepared = true;
    }
    /* Outwards facing function that all other medkits will also use to update any given item with another */
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
        if (!onUseFlag) genericUtils.setProperty(sourceItemData, 'flags.midi-qol.-=onUseMacroName', null);
        if (itemType === 'spell') sourceItemData.system.preparation = itemData.system.preparation;
        if (itemType != 'spell' && itemType != 'feat') {
            sourceItemData.system.attunement = itemData.system.attunement;
            sourceItemData.system.equipped = itemData.system.equipped;
        }
        if (itemData.system.quantity) sourceItemData.system.quantity = itemData.system.quantity;
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
        if (itemData.folder) sourceItemData.folder = itemData.folder;
        if (item.effects.size) await item.deleteEmbeddedDocuments('ActiveEffect', item.effects.map(i => i.id));
        await item.update(sourceItemData, {diff: false, recursive: false});
        return item;
    }
    static async _update(event, target) {
        /* Keep track of current tab */
        let currentTabId = this.element.querySelector('.item.active').getAttribute('data-tab');
        this.activeTab = currentTabId;
        let source = this.availableAutomations.find(i => i.source === this._source);
        if (!source) return;
        /* Keep the CPR flags */
        await this.item.update({'flags.-=chris-premades': null});
        this._cleanObject(this.flags); // Clean up any leftover undefined flags from adding/removing properties
        await this.item.update({'flags.chris-premades': genericUtils.deepClone(this.flags)});
        await ItemMedkit.update(this.item, source.document, {source: source.source, version: source.version});
        this.flags = genericUtils?.deepClone(this.item?.flags['chris-premades']) ?? {};
        this.selectedGenericFeatures = Object.keys(this.flags?.config?.generic ?? {});
        this._prepared = false;
        await this.readyData();
        await this._reRender();
    }
    static async _apply(event, target) {
        /* Keep track of current tab */
        let currentTabId = this.element.querySelector('.item.active').getAttribute('data-tab');
        this.activeTab = currentTabId;
        /* Get the data ready and add it to the current item */
        this._cleanObject(this.flags); // Clean up any leftover undefined flags from adding/removing properties
        await this.item.update({'flags.-=chris-premades': null});
        let genericConfigs = genericUtils.getProperty(this.flags, 'config.generic');
        if (genericConfigs) {
            let configs = this.genericFeaturesConfigs;
            this.flags.config.generic = Object.fromEntries(Object.entries(genericConfigs).map(([key, value]) => {
                let setKeys = Object.keys(value);
                let neededKeys = configs[key]?.configOptions.map(i => i.id) ?? [];
                for (let currKey of neededKeys) {
                    if (!setKeys.includes(currKey)) value[currKey] = configs[key].configOptions.find(i => i.id === currKey)?.value;
                }
                return [key, value];
            }));
        }
        await this.item.update({'flags.chris-premades': genericUtils.deepClone(this.flags)});
        // If the current source is not the selected source, change it, if the select source is none, clear out the flags we add, if the selected source is development, do nothing.
        if (this._source != this.selectedSource) {
            // Different sources, do something about it
            if (!this.selectedSource) {
                genericUtils.log('dev', 'Applying "NONE" automation');
                // The 'none' option was selected, so we want to clear out the CPR flags
                await this.item.update({'flags.-=chris-premades': null}); // May need to clear more flags here for MISC/GPS integration.
            } else if (this.selectedSource === 'development') { // This takes slightly too long, but is there any way to change that??
                if (this._macro) {
                    genericUtils.log('dev', 'Applying source, version, and macros for ' + this.identifier);
                    if (!this.flags.info.source) {
                        await this.item.setFlag('chris-premades', 'info.source', this._macro?.source ?? 'chris-premades');
                    }
                    if (!this.flags.info.version && this._macro?.version) {
                        await this.item.setFlag('chris-premades', 'info.version', this._macro.version);
                    }
                    if (!this.flags.info.hasAnimation && this._macro.hasAnimation) {
                        await this.item.setFlag('chris-premades', 'info.hasAnimation', this._macro.hasAnimation);
                    }
                    // The Object.values part gets us the nested macros (item and actor) and the Object.keys adds in all the keys otherwise (all the macros plus everything else)
                    let flagKeys = Object.values(this._macro).filter(i => (i instanceof Object) && (!Array.isArray(i))).flatMap(i => Object.keys(i)).concat(Object.keys(this._macro));
                    if (flagKeys) {
                        // Macro info config options will have the flag path we need, and will have all macros, match those with the keys we have to get the bases for what we insert.
                        let flagBases = this.devToolsOptions.macroInfo.configOptions.filter(i => flagKeys.includes(i.id));
                        // For each of the flag bases, if there's already a flag, add to it, otherwise, just set it.
                        await flagBases.forEach(async i => {
                            let currentFlag = genericUtils.getProperty(this.flags, i.flag.key);
                            if (currentFlag) { // If there's already a flag there, is it this one? Otherwise, add to it.
                                if (!currentFlag.includes(this.identifier)) {
                                    await this.item.setFlag('chris-premades', i.flag.key, currentFlag.concat([this.identifier]));
                                }
                            } else { // No flag yet, make it.
                                await this.item.setFlag('chris-premades', i.flag.key, [this.identifier]);
                            }
                        });
                    }
                }
            } else {
                let source = this.availableAutomations.find(i => i.source === this.selectedSource);
                if (source) {
                    genericUtils.log('dev', 'Applying "' + source.source + '" automation');
                    await ItemMedkit.update(this.item, source.document, {source: source.source, version: source.version});
                }
            }
        }
        /* Update the data in the application and re-render */
        await genericUtils.sleep(50); // This makes the macro flags actually get applied the first time around, not sure what else to do about it.
        this.flags = genericUtils.deepClone(this.item?.flags['chris-premades']) ?? {};
        this.selectedGenericFeatures = Object.keys(this.flags?.config?.generic ?? {});
        this._prepared = false;
        await this.readyData();
        await this._reRender();
    }
    static async confirm(event, target) {
        await ItemMedkit._apply.bind(this)(event, target);
        this.close();
    }
    /* Internally called functions */
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
        return context;
    }
    async _reRender() {
        let autoPos = {...this.position, height: 'auto'};
        this.setPosition(autoPos);
        await this.render(true);
        let maxHeight = canvas.screenDimensions[1] * 0.9;
        let newPos = {...this.position, height: Math.min(this.element.scrollHeight, maxHeight), top:null};
        this.setPosition(newPos);
    }
    _cleanObject(obj) {
        for (let key in obj) {
            if (obj[key] && typeof obj[key] === 'object') {
                this._cleanObject(obj[key]);
                if (Object.keys(obj[key]).length === 0) {
                    delete obj[key];
                }
            }
            if ((obj[key] == undefined) || (obj[key] === '')) {
                delete obj[key];
            }
        }
        return obj;
    }
    async _onChangeForm(formConfig, event) {
        /* Keep track of the current tab */
        let currentTabId = this.element.querySelector('.item.active').getAttribute('data-tab');
        this.activeTab = currentTabId;
        /* Get our data out of the html so we can find what option the input coresponds with */
        let dataOptions = event.target.closest('[data-options]')?.getAttribute('data-options');
        let dataCategory = event.target.closest('[data-category]')?.getAttribute('data-category');
        let tagName = event.target?.tagName?.toLowerCase();
        let inputType = ['file-picker', 'multi-select'].includes(tagName) ? tagName : event.target.type;
        let elementId = event.target.id === '' ? event.target.parentElement.id : event.target.id;
        let optionGroup = dataCategory ? this[dataOptions][dataCategory].configOptions : dataOptions ? this[dataOptions] : this[elementId];
        let option = optionGroup.find(i => (i.id ?? null) === elementId);
        /* Set the option's value based on the input type */
        switch (inputType) {
            case 'checkbox': {
                option.value = event.target.checked;
                break;
            }
            case 'text':
            case 'number': 
            case 'select-one':
            case 'file-picker':
            case 'multi-select': {
                option.value = event.target.value;
            }
        }
        /* Now, actually set the value that will be kept, via this.flags */
        if (option?.flag) {
            switch (option.flag.value) {
                case 'array': {
                    let value = undefined;
                    if (event.target.value === '') {
                        genericUtils.setProperty(this.flags, option.flag.key, undefined);
                    } else {
                        try {
                            value = JSON.parse(event.target.value.replace(/'/g, '"'));
                        } catch (error) {
                            ui.notifications.error('Error with ' + event.target.previousElementSibling.innerHTML + ' field, see console');
                            console.error(error);
                        }
                        if (value) genericUtils.setProperty(this.flags, option.flag.key, value);
                    }
                    break;
                }
                case 'value':
                default:
                    genericUtils.setProperty(this.flags, option.flag.key, option.value);
            }
        }
        /* Special casing for selecting an automation */
        if (event.target.id === 'select-automation') {
            this.selectedSource = event.target.querySelector('option:checked').id;
        }
        /* Special casing for generic monster features */
        if (event.target.id === 'select-generic-monster-features') {
            let oldFeatures = genericUtils.duplicate(this.selectedGenericFeatures);
            let newFeatures = option.value;
            let featureIdentifierToAdd = newFeatures.find(i => !oldFeatures.includes(i));
            if (featureIdentifierToAdd) {
                if (!this.flags?.config?.generic?.[featureIdentifierToAdd]) genericUtils.setProperty(this.flags, 'config.generic.' + featureIdentifierToAdd, {applied: true});
                let featureToAdd = this.constants.genericFeatureMacros[featureIdentifierToAdd];
                if (featureToAdd) {
                    // The Object.values part gets us the nested macros (item and actor) and the Object.keys adds in all the keys otherwise (all the macros plus everything else)
                    let flagKeys = Object.values(featureToAdd).filter(i => (i instanceof Object) && (!Array.isArray(i))).flatMap(i => Object.keys(i)).concat(Object.keys(featureToAdd));
                    if (flagKeys) {
                        // Macro info config options will have the flag path we need, and will have all macros, match those with the keys we have to get the bases for what we insert.
                        let flagBases = this.devToolsOptions.macroInfo.configOptions.filter(i => flagKeys.includes(i.id));
                        // For each of the flag bases, if there's already a flag, add to it, otherwise, just set it.
                        flagBases.forEach(i => {
                            let currentFlag = genericUtils.getProperty(this.flags, i.flag.key);
                            if (currentFlag) {
                                genericUtils.setProperty(this.flags, i.flag.key, currentFlag.concat([featureIdentifierToAdd]));
                            } else {
                                genericUtils.setProperty(this.flags, i.flag.key, [featureIdentifierToAdd]);
                            }
                        });
                    }
                }
            }
            let featureIdentifierToRemove = oldFeatures.find(i => !newFeatures.includes(i));
            if (featureIdentifierToRemove) {
                let featureToRemove = this.constants.genericFeatureMacros[featureIdentifierToRemove];
                if (featureToRemove) {
                    // The Object.values part gets us the nested macros (item and actor) and the Object.keys adds in all the keys otherwise (all the macros plus everything else)
                    let flagKeys = Object.values(featureToRemove).filter(i => (i instanceof Object) && (!Array.isArray(i))).flatMap(i => Object.keys(i)).concat(Object.keys(featureToRemove));
                    if (flagKeys) {
                        // Macro info config options will have the flag path we need, and will have all macros, match those with the keys we have to get the bases for what we insert.
                        let flagBases = this.devToolsOptions.macroInfo.configOptions.filter(i => flagKeys.includes(i.id));
                        // For each of the flag bases, take the current flag, find and splice out the feature we're removing.
                        flagBases.forEach( i => {
                            let currentFlag = genericUtils.getProperty(this.flags, i.flag.key);
                            let index = currentFlag.indexOf(featureIdentifierToRemove);
                            currentFlag.splice(index, 1);
                            // If that ends up with an empty array, just set it as undefined.
                            let newFlag = currentFlag.length === 0 ? undefined : currentFlag;
                            genericUtils.setProperty(this.flags, i.flag.key, newFlag);
                        });
                    }
                }
            }
            this.selectedGenericFeatures = option.value;
        }
        /* --- */
        await this._reRender();
    }
    async _onSubmitForm(formConfig, event) {
        event.preventDefault();
    }
    changeTab(...args) {
        let autoPos = {...this.position, height: 'auto'};
        this.setPosition(autoPos);
        super.changeTab(...args);
        let maxHeight = canvas.screenDimensions[1] * 0.9;
        let newPos = {...this.position, height: Math.min(this.element.scrollHeight, maxHeight), top:null};
        this.setPosition(newPos);
    }
}