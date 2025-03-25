import {genericUtils, macroUtils} from '../utils.js';

export const eventStructure = {
    check: [
        {
            pass: 'situational',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'context',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'bonus',
            documents: [
                'item',
                'effect',
                'template',
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
                'effect',
                'template',
                'region'
            ]
        }
    ],
    save: [
        {
            pass: 'situational',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'context',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'bonus',
            documents: [
                'item',
                'effect',
                'template',
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
                'effect',
                'template',
                'region'
            ]
        }
    ],
    aura: [
        {
            pass: 'create',
            documents: [
                'item',
                'effect'
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
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'turnStart',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'everyTurn',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'turnEndNear',
            documents: [
                'item',
                'effect',
                'template',
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
                'effect',
                'template',
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
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'combatEnd',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        }
    ],
    createItem: [
        {
            pass: 'created',
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
                'effect',
                'template',
                'region'
            ]
        }
    ],
    effect: [
        {
            pass: 'created',
            documents: [
                'effect'
            ]
        },
        {
            pass: 'deleted',
            documents: [
                'effect'
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
    midi: [
        {
            pass: 'preTargeting',
            documents: [
                'item',
                'effect',
                'template',
                'region',
                'activity'
            ]
        },
        {
            pass: 'preItemRoll',
            documents: [
                'item',
                'effect',
                'template',
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
                'effect',
                'template',
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
                'effect',
                'template',
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
                'effect',
                'template',
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
                'effect',
                'template',
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
                'effect',
                'template',
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
                'effect',
                'template',
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
                'effect',
                'template',
                'region',
                'activity'
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
                'effect'
            ],
            options: [
                'scene'
            ]
        },
        {
            pass: 'movedNear',
            documents: [
                'item',
                'effect'
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
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'long',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        }
    ],
    skill: [
        {
            pass: 'situational',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'context',
            documents: [
                'item',
                'effect',
                'template',
                'region'
            ]
        },
        {
            pass: 'bonus',
            documents: [
                'item',
                'effect',
                'template',
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
                'effect',
                'template',
                'region'
            ]
        }
    ],
    template: [
        {
            pass: 'left',
            documents: [
                'template'
            ]
        },
        {
            pass: 'enter',
            documents: [
                'template'
            ]
        },
        {
            pass: 'stay',
            documents: [
                'template'
            ]
        },
        {
            pass: 'passedThrough',
            documents: [
                'template'
            ]
        },
        {
            pass: 'moved',
            documents: [
                'template'
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
        this.position.width = 'auto';
        this.position.height = 'auto';
        this.windowTitle = 'Embedded Macros';
        this.content = 'Change this.';
        this.document = document;
        this.context = {
            macros: Object.entries(macroUtils.getAllEmbeddedMacros(this.document)).filter(([key, value]) => value.length).flatMap(([key, value]) => {
                return value.map(i => ({type: key, ...i}));
            }),
            passes: getAllDocumentPasses(this.document)
        };
        this._activeTab = this.context.macros.length ? this.context.macros[0].name : 'zzzNewTab';
        console.log(this.context);
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
            confirm: EmbeddedMacros.confirm
        },
        window: {
            title: 'Default Title',
            resizable: true,
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
            template: 'modules/chris-premades/templates/form-footer.hbs'
        },
    };
    static async confirm(event, target) {
        if (!target.name) return false;
        //TODO
        this.close();
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
        let tabsData = {
            zzzNewTab: {
                icon: 'fa-solid fa-hammer',
                label: 'CHRISPREMADES.EmbeddedMacros.Tabs.New.Label',
                tooltip: 'CHRISPREMADES.EmbeddedMacros.Tabs.New.Tooltip',
                cssClass: 'new-macro'
            }
        };
        this.context.macros.forEach(i => {
            genericUtils.setProperty(tabsData, i.name, {
                icon: 'fa-solid fa-hammer',
                label: i.name,
                cssClass: this.activeTab === i.name ? 'active' : ''
            });
        });
        console.log(tabsData);
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
        return {
            macro: this.context.macros.find(i => i.name === this.activeTab)
        };
    }
    async _prepareContext(options) {
        let context = this.formatInputs();
        let buttons = [
            {type: 'button', action: 'apply', label: 'DND5E.Apply', name: 'apply', icon: 'fa-solid fa-download'},
            {type: 'submit', action: 'confirm', label: 'DND5E.Confirm', name: 'confirm', icon: 'fa-solid fa-check'}
        ];
        let tabs = this.tabsData;
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
        let currentContext = this.context;
        /*if (targetInput.type === 'checkbox') {
            foundry.utils.setProperty(currentContext, 'compendiums.' + targetInput.name + '.isChecked', targetInput?.checked);
        }
        else if (targetInput.type === 'number') {
            foundry.utils.setProperty(currentContext, 'compendiums.' + targetInput.name, Number(targetInput?.value));
        } */
        this.context = currentContext;
        this.render(true);
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