import {genericUtils, macroUtils} from '../utils.js';
const fields = foundry.data.fields;
export const eventStructure = {
    check: [
        {
            pass: 'situational',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'sceneSituational',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'context',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'bonus',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ],
            options: [
                'scene'
            ]
        },
        {
            pass: 'post',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        }
    ],
    save: [
        {
            pass: 'situational',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'sceneSituational',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'targetSituational',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'context',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'bonus',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ],
            options: [
                'scene'
            ]
        },
        {
            pass: 'post',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        }
    ],
    aura: [
        {
            pass: 'create',
            documents: [
                'item',
                'activeeffect'
            ],
            requiredValues: [
                {
                    key: 'distance',
                    types: [Number] // Any positive number.
                },
                {
                    key: 'identifier',
                    types: [String] // The CPR effect identifier for the aura while it's on a target. Must not be the same as the entity's CPR identifier! Generally this is the entity identifier + 'Aura'.
                }
            ],
            optionalValues: [
                {
                    key: 'disposition',
                    types: [String] // 'ally', 'enemy', 'neutral', null (all)
                },
                {
                    key: 'conscious',
                    types: [Boolean] // true requires the aura giver to be conscious.
                }
            ]
        }
    ],
    combat: [
        {
            pass: 'turnEnd',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'turnStart',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'everyTurn',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'turnEndNear',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ],
            optionalValues: [
                {
                    key: 'distance',
                    types: [Number] // Any positive number or null for unlimited range.
                },
                {
                    key: 'disposition',
                    types: [String] // 'ally', 'enemy', 'neutral', null (all)
                }
            ]
        },
        {
            pass: 'turnStartNear',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ],
            optionalValues: [
                {
                    key: 'distance',
                    types: [Number] // Any positive number or null for unlimited range.
                },
                {
                    key: 'disposition',
                    types: [String] // 'ally', 'enemy', 'neutral', null (all)
                }
            ]
        },
        {
            pass: 'combatStart',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'combatEnd',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'turnEndSource',
            documents: [
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'turnStartSource',
            documents: [
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        }
    ],
    item: [
        {
            pass: 'created',
            documents: [
                'item'
            ]
        },
        {
            pass: 'deleted',
            documents: [
                'item'
            ]
        },
        {
            pass: 'actorCreated',
            documents: [
                'item'
            ]
        },
        {
            pass: 'actorDeleted',
            documents: [
                'item'
            ]
        },
        {
            pass: 'equipped',
            documents: [
                'item'
            ]
        },
        {
            pass: 'unequipped',
            documents: [
                'item'
            ]
        },
        {
            pass: 'actorEquipped',
            documents: [
                'item'
            ]
        },
        {
            pass: 'actorUnequipped',
            documents: [
                'item'
            ]
        },
        {
            pass: 'itemMedkit',
            documents: [
                'item'
            ]
        },
        {
            pass: 'actorMedkit',
            documents: [
                'item'
            ]
        },
        {
            pass: 'actorMunch',
            documents: [
                'item'
            ]
        }
    ],
    death: [
        {
            pass: 'dead',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        }
    ],
    effect: [
        {
            pass: 'created',
            documents: [
                'activeeffect'
            ]
        },
        {
            pass: 'deleted',
            documents: [
                'activeeffect'
            ]
        },
        {
            pass: 'preCreateEffect',
            documents: []
        },
        {
            pass: 'preUpdateEffect',
            documents: []
        }
    ],
    'midi-item': [
        {
            pass: 'preTargeting',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region',
                'activity'
            ]
        },
        {
            pass: 'preItemRoll',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region',
                'activity'
            ],
            options: [
                'target'
            ]
        },
        {
            pass: 'preambleComplete',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region',
                'activity'
            ],
            options: [
                'target',
                'scene'
            ]
        },
        {
            pass: 'postAttackRoll',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region',
                'activity'
            ],
            options: [
                'target',
                'scene'
            ]
        },
        {
            pass: 'attackRollComplete',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region',
                'activity'
            ],
            options: [
                'target',
                'scene'
            ]
        },
        {
            pass: 'savesComplete',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region',
                'activity'
            ],
            options: [
                'target'
            ]
        },
        {
            pass: 'damageRollComplete',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region',
                'activity'
            ],
            options: [
                'target',
                'scene'
            ]
        },
        {
            pass: 'rollFinished',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region',
                'activity'
            ],
            options: [
                'target',
                'scene'
            ]
        },
        {
            pass: 'applyDamage',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region',
                'activity'
            ],
            options: [
                'target',
                'scene'
            ]
        }
    ],
    'midi-actor': [
        {
            pass: 'preTargeting',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'preItemRoll',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ],
            options: [
                'target'
            ]
        },
        {
            pass: 'preambleComplete',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ],
            options: [
                'target',
                'scene'
            ]
        },
        {
            pass: 'postAttackRoll',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ],
            options: [
                'target',
                'scene'
            ]
        },
        {
            pass: 'attackRollComplete',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ],
            options: [
                'target',
                'scene'
            ]
        },
        {
            pass: 'savesComplete',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ],
            options: [
                'target'
            ]
        },
        {
            pass: 'damageRollComplete',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ],
            options: [
                'target',
                'scene'
            ]
        },
        {
            pass: 'rollFinished',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ],
            options: [
                'target',
                'scene'
            ]
        },
        {
            pass: 'applyDamage',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ],
            options: [
                'target',
                'scene'
            ]
        }
    ],
    movement: [
        {
            pass: 'moved',
            documents: [
                'item',
                'activeeffect'
            ]
        },
        {
            pass: 'movedScene',
            documents: [
                'item',
                'activeeffect'
            ],
        },
        {
            pass: 'movedNear',
            documents: [
                'item',
                'activeeffect'
            ],
            requiredValues: [
                {
                    key: 'distance',
                    types: [Number]
                }
            ]
        },
        {
            pass: 'create',
            documents: [
                'item',
                'activeeffect'
            ],
            options: [
                'scene'
            ]
        },
        {
            pass: 'deleted',
            documents: [
                'item',
                'activeeffect'
            ],
            options: [
                'scene'
            ]
        }
    ],
    region: [
        {
            pass: 'left',
            documents: [
                'region'
            ]
        },
        {
            pass: 'enter',
            documents: [
                'region'
            ]
        },
        {
            pass: 'stay',
            documents: [
                'region'
            ]
        },
        {
            pass: 'passedThrough',
            documents: [
                'region'
            ]
        }
    ],
    rest: [
        {
            pass: 'short',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'long',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        }
    ],
    skill: [
        {
            pass: 'situational',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'sceneSituational',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'context',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'bonus',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ],
            options: [
                'scene'
            ]
        },
        {
            pass: 'post',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        }
    ],
    template: [
        {
            pass: 'left',
            documents: [
                'measuredtemplate'
            ]
        },
        {
            pass: 'enter',
            documents: [
                'measuredtemplate'
            ]
        },
        {
            pass: 'stay',
            documents: [
                'measuredtemplate'
            ]
        },
        {
            pass: 'passedThrough',
            documents: [
                'measuredtemplate'
            ]
        },
        {
            pass: 'moved',
            documents: [
                'measuredtemplate'
            ]
        },
        {
            pass: 'created',
            documents: [
                'measuredtemplate'
            ]
        },
        {
            pass: 'deleted',
            documents: [
                'measuredtemplate'
            ]
        }
    ],
    toolCheck: [
        {
            pass: 'situational',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'context',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        },
        {
            pass: 'bonus',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ],
            options: [
                'scene'
            ]
        },
        {
            pass: 'post',
            documents: [
                'item',
                'activeeffect',
                'measuredtemplate',
                'region'
            ]
        }
    ]
};
export function getDocumentPasses(document, type) {
    let documentType = document.documentName.toLowerCase();
    let passes = [];
    eventStructure[type]?.forEach(i => {
        if (i.documents.includes(documentType)) passes.push(i.pass);
        if (i.options && i.documents.includes(documentType)) i.options.forEach(option => {
            passes.push(option + i.pass.capitalize());
        });
    });
    return passes;
}

export function getEventTypes() {
    return Object.keys(eventStructure);
}
export function getAllDocumentPasses(document) {
    let passes = {};
    getEventTypes().forEach(i => {
        passes[i] = getDocumentPasses(document, i);
    });
    return passes;
}
let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
export class EmbeddedMacros extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(document) {
        super({id: 'cpr-embedded-macros-window'});
        this.windowTitle = 'Embedded Macros';
        this.content = 'Change this.';
        this.document = document;
        this.documentName = document.documentName;
        this.context = {
            macros: Object.entries(macroUtils.getAllEmbeddedMacros(this.document)).filter(([key, value]) => value.length).flatMap(([key, value]) => {
                return value.map(i => ({type: key, ...i}));
            }),
            passes: getAllDocumentPasses(this.document)
        };
        this._activeTab = this.context.macros[0]?.name;
    }
    static DEFAULT_OPTIONS = {
        tag: 'form',
        form: {
            handler: EmbeddedMacros.formHandler,
            submitOnChange: false,
            closeOnSubmit: false,
            id: 'cpr-embedded-macros-window'
        },
        actions: {
            apply: EmbeddedMacros._apply,
            confirm: EmbeddedMacros.confirm,
            newMacro: EmbeddedMacros.#onNewMacro,
            delete: EmbeddedMacros.#onDelete
        },
        window: {
            title: 'Default Title',
            resizable: true,
            contentClasses: ['standard-form']
        },
        position: {
            width: 700,
            height: 'auto'
        }
    };
    static PARTS = {
        header: {
            template: 'modules/chris-premades/templates/embedded-macros-header.hbs'
        },
        navigation: {
            template: 'modules/chris-premades/templates/embedded-macros-navigation.hbs'
        },
        form: {
            template: 'modules/chris-premades/templates/embedded-macros-form.hbs',
            scrollable: ['']
        },
        footer: {
            template: 'templates/generic/form-footer.hbs'
        },
    };
    static async confirm(event, target) {
        let canClose = await EmbeddedMacros._apply.bind(this)(event, target);
        if (canClose) this.close();
    }
    static async _apply(event, target) {
        if (!target.name) return false;
        let validator = new fields.JavaScriptField({async: true});
        let invalid = false;
        for (let currMacro of this.context.macros) {
            if (validator.validate(currMacro.macro)) {
                let invalidText = genericUtils.format('CHRISPREMADES.Medkit.EmbeddedMacros.Invalid', {
                    fieldName: 'macro',
                    macroName: currMacro.name
                });
                genericUtils.notify(invalidText, 'error');
                invalid = true;
            } else if (!currMacro.type) {
                let invalidText = genericUtils.format('CHRISPREMADES.Medkit.EmbeddedMacros.Invalid', {
                    fieldName: 'type',
                    macroName: currMacro.name
                });
                genericUtils.notify(invalidText, 'error');
                invalid = true;
            }
        }
        if (invalid) return false;
        let flagPath;
        let entity;
        if (this.documentName === 'Activity') {
            flagPath = 'flags.chris-premades.embeddedActivityMacros.' + this.document.id;
            entity = this.document.item;
        } else {
            flagPath = 'flags.chris-premades.embeddedMacros';
            entity = this.document;
        }
        await genericUtils.update(entity, {
            [flagPath]: this.context.macros
        });
        return this.render();
    }
    static #onNewMacro(event, target) {
        let newName = genericUtils.translate('CHRISPREMADES.EmbeddedMacros.Tabs.New.Label');
        if (this.context.macros.find(i => i.name === newName)) newName += ' (1)';
        let currIdx = 1;
        while (this.context.macros.find(i => i.name === newName)) {
            currIdx += 1;
            newName = newName.replace('(' + (currIdx - 1) + ')', '(' + currIdx + ')');
        }
        this.context.macros.push({
            name: newName
        });
        this.activeTab = newName;
        this.render();
    }
    static #onDelete(event, target) {
        this.context.macros = this.context.macros.filter(i => i.name !== this.activeTab);
        this.activeTab = this.context.macros[0]?.name;
        this.render();
    }
    get title() {
        return this.windowTitle;
    }
    get results() {
        return this._results;
    }
    set results(value) {
        this._results = value;
    }
    get context() {
        return this._context;
    }
    set context(value) {
        this._context = value;
    }
    get tabsData() {
        let tabsData = {};
        this.context.macros.forEach(i => {
            genericUtils.setProperty(tabsData, i.name, {
                icon: 'fa-solid fa-hammer',
                label: i.name,
                cssClass: this.activeTab === i.name ? 'active' : ''
            });
        });
        return tabsData;
    }
    get activeTab() {
        return this._activeTab;
    }
    set activeTab(tab) {
        this._activeTab = tab;
    }
    makeButton(label, name) {
        return {type: 'submit', action: 'confirm', label: label, name: name};
    }
    formatInputs() {
        let macro = this.context.macros.find(i => i.name === this.activeTab);
        if (!macro) return [];
        let inputs = {
            macro: {
                field: new fields.JavaScriptField({
                    async: true,
                    label: 'CHRISPREMADES.EmbeddedMacros.Macro.Label'
                }),
                value: macro.macro
            },
            name: {
                field: new fields.StringField({
                    label: 'CHRISPREMADES.EmbeddedMacros.Name.Label'
                }),
                value: macro.name,
            },
            type: {
                field: new fields.StringField({
                    label: 'CHRISPREMADES.EmbeddedMacros.Type.Label',
                    choices: Object.entries(this.context.passes).reduce((acc, [key, value]) => {
                        if (value.length) acc[key] = 'CHRISPREMADES.EmbeddedMacros.Type.' + key;
                        return acc;
                    }, {})
                }),
                value: macro.type
            },
            priority: {
                field: new fields.NumberField({
                    min: 0,
                    integer: true,
                    label: 'CHRISPREMADES.EmbeddedMacros.Priority.Label'
                }),
                value: macro.priority,
            }
        };
        if (macro.type) {
            genericUtils.setProperty(inputs, 'pass', {
                field: new fields.StringField({
                    label: 'CHRISPREMADES.EmbeddedMacros.Pass.Label',
                    choices: this.context.passes[macro.type].reduce((acc,i) => ({
                        ...acc,
                        [i]: 'CHRISPREMADES.EmbeddedMacros.Pass.' + i + '.Label'
                    }), {})
                }),
                value: macro.pass
            });
        }
        let passDetails = eventStructure[macro.type]?.find(i => i.pass === macro.pass);
        let requiredValues = passDetails?.requiredValues?.map(i => i.key) ?? [];
        let optionalValues = passDetails?.optionalValues?.map(i => i.key) ?? [];
        let extraValues = requiredValues.concat(optionalValues);
        if (extraValues.includes('distance')) {
            genericUtils.setProperty(inputs, 'distance', {
                field: new fields.NumberField({
                    min: 0,
                    integer: true,
                    label: 'CHRISPREMADES.EmbeddedMacros.Distance.Label'
                }),
                value: macro.distance,
            });
        }
        if (extraValues.includes('disposition')) {
            genericUtils.setProperty(inputs, 'disposition', {
                field: new fields.StringField({
                    label: 'CHRISPREMADES.EmbeddedMacros.Disposition.Label',
                    choices: {
                        all: 'CHRISPREMADES.EmbeddedMacros.Disposition.All.Label',
                        ally: 'CHRISPREMADES.EmbeddedMacros.Disposition.Ally.Label',
                        enemy: 'CHRISPREMADES.EmbeddedMacros.Disposition.Enemy.Label'
                    }
                }),
                value: macro.disposition
            });
        }
        if (extraValues.includes('conscious')) {
            genericUtils.setProperty(inputs, 'conscious', {
                field: new fields.BooleanField({
                    label: 'CHRISPREMADES.EmbeddedMacros.Conscious.Label'
                }),
                value: macro.conscious,
            });
        }
        if (extraValues.includes('identifier')) {
            genericUtils.setProperty(inputs, 'identifier', {
                field: new fields.StringField({
                    label: 'CHRISPREMADES.EmbeddedMacros.Identifier.Label'
                }),
                value: macro.identifier,
            });
        }
        return inputs;
    }
    async _prepareContext(options) {
        let context = {
            inputs: this.formatInputs(),
            buttons:[
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
    async _onChangeForm(formConfig, event) {
        let targetInput = event.target;
        if (targetInput.name === 'name' && this.context.macros.find(i => i.name === targetInput.value)) {
            // Disallow same-name macros
            return this.render();
        }
        let currentMacro = this.context.macros.find(i => i.name === this.activeTab);
        switch (targetInput.type) {
            case 'checkbox':
                genericUtils.setProperty(currentMacro, targetInput.name, targetInput.checked);
                break;
            case 'number':
            case 'text':
            case 'textarea':
            case 'select-one':
            default:
                if (targetInput.name === 'name') this.activeTab = targetInput.value;
                genericUtils.setProperty(currentMacro, targetInput.name, targetInput.value);
                break;
        }
        if (targetInput.name !== 'macro') this.render(true);
    }
    async _onSubmitForm(formConfig, event) {
        event.preventDefault();
    }
    changeTab(...args) {
        this.activeTab = args[0];
        this.render();
    }
}