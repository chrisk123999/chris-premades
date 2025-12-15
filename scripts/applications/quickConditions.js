let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
import {quickConditions} from '../extensions/quickConditions.js';
import {genericUtils} from '../utils.js';
export class QuickConditions extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(data) {
        super({id: 'cpr-quick-conditions-window'});
        this.windowTitle = genericUtils.translate('CHRISPREMADES.QuickConditions.Title');
        this.data = data;
        this.value = this.data.entity[this.data.fieldId];
        this._conditions = quickConditions.constants;
        // eslint-disable-next-line no-undef
        this._activeConditions = new Collection();
        // eslint-disable-next-line no-undef
        this._inactiveConditions = new Collection(quickConditions.constants.entries());
    }
    static DEFAULT_OPTIONS = {
        tag: 'form',
        form: {
            handler: QuickConditions.formHandler,
            submitOnChange: false,
            closeOnSubmit: false,
            id: 'cpr-quick-conditions-window'
        },
        actions: {
            confirm: QuickConditions.confirm,
            add: QuickConditions.add,
            remove: QuickConditions.remove
        },
        window: {
            title: 'Default Title',
            resizable: true
        },
        classes: ['standard-form'],
        position: {
            width: '450',
            height: 'auto'
        }
    };
    static PARTS = {
        form: {
            template: 'modules/chris-premades/templates/quick-conditions.hbs',
            scrollable: ['']
        },
        footer: {
            template: 'templates/generic/form-footer.hbs'
        }
    };
    /* Button Events */
    static confirm(event, target) {
        let value = target.name;
        if (value === 'true') {
            let entity = this.data.entity;
            if (entity) genericUtils.update(entity, {[this.data.fieldId]: this.value});
        }
        this.close();
    }
    static add(event, target) {
        let conditionId = target.id;
        let condition = this.inactiveConditions.get(conditionId);
        this.activateCondition(conditionId);
        let baseArray = condition.format.split(/\$([a-zA-Z_][a-zA-Z0-9_]*)/).filter(Boolean);
        // Using the baseArray to format what's added to the newValue
        let newValue = this.value;
        if (newValue.length) newValue += ' && ';
        baseArray.map(i => {
            let placeholder = condition.data[i];
            let placeholderValue = placeholder?.default;
            if (placeholderValue || (placeholderValue === false)) {
                // Stringify array otherwise match the value to the name
                if (placeholderValue instanceof Array) {
                    newValue += JSON.stringify(placeholderValue);
                } else {
                    if ([true, false, 'true', 'false'].includes(placeholderValue)) {
                        newValue += placeholder.options.find(j => String(j.value) == String(placeholderValue))?.name;
                    } else {
                        newValue += placeholderValue;
                    }
                }
            } else {
                // Not a placeholder, just content
                newValue += i;
            }
        });
        this.value = newValue;
        this.render(true);
    }
    static remove(event, target) {
        let targetGroup = target.closest('div.quick-conditions-group-condition-remove');
        let conditonId = targetGroup.id.replace('-remove', '');
        let currentContext = this.context;
        let inputs = currentContext.inputs.edit;
        inputs.splice(inputs.findIndex(i => i.id === conditonId), 3);
        if (inputs.at(-1)?.id?.includes('logic')) inputs.splice(-1, 1);
        let el = this.element;
        el.querySelector('div.quick-conditions-group-condition#' + conditonId).remove();
        let logicEl = targetGroup.nextElementSibling ?? targetGroup.previousElementSibling;
        if (logicEl) logicEl.remove();
        targetGroup.remove();
        this.inactivateCondition(conditonId);
        let buttonHTML = quickConditions.helpers.button({
            id: conditonId,
            name: conditonId,
            type: 'button',
            class: 'quick-conditions-button-add',
            dataAction: 'add',
            label: conditonId
        });
        let button = document.createElement('template');
        button.innerHTML = buttonHTML;
        button = button.content.firstChild;
        let addFieldset = el.querySelector('fieldset.quick-conditions-fieldset-add#add');
        addFieldset.appendChild(button);
        this.terms = inputs;
        this.context = currentContext;
    }
    get terms() {
        return this.parseTerms(this.value);
    }
    /* String manipulation to and from inputs */
    parseTerms(value) {
        // Split up terms
        let terms = value.split(/(\|\||&&)/g).map(s => s.trim()).filter(Boolean);
        for (let i = 0; i < terms.length; i++) {
            let term = terms[i];
            // Determine the format, give it the inputs
            if (['&&', '||'].includes(term)) { // If it's the logical operator, do that
                terms[i] = {
                    id: 'group-logic-' + i,
                    class: 'quick-conditions-group-logic',
                    inputs: [{
                        default: '&&',
                        id: 'logic-' + i,
                        name: 'logic-' + i,
                        type: 'select',
                        class: 'quick-conditions-select-logic',
                        options: [
                            {
                                name: '&&',
                                value: '&&'
                            },
                            {
                                name: '!!',
                                value: '!!'
                            }
                        ],
                        value: term
                    }]
                };
            } else {
                let [condition, conditionKey] = this.findCondition(term);
                if (condition) {
                    let baseArray = condition.format.split(/\$([a-zA-Z_][a-zA-Z_]*)/).filter(Boolean);
                    let baseStrings = baseArray.filter(i => !Object.keys(condition.data).some(j => j === i));
                    let termValues = new Set(baseStrings.reduce((acc, value) => acc = acc.replace(value, ''), term.replaceAll("'", '"')).split(/(!|\[[^\]]*\]|'[^']*'|"[^"]*"|\d+|<=|>=|===|==|<|>|=)/).filter(Boolean).map(s => s.trim()).filter(Boolean).map(i => this.safeParse(i)));
                    let inputs = [];
                    for (let i = 0; i < baseArray.length; i++) {
                        let current = baseArray[i];
                        if (Object.keys(condition.data).includes(current)){
                            let inputData = condition.data[current];
                            let value = termValues.find(j => inputData.varType(j));
                            termValues.delete(value);
                            let inputType = typeof inputData.default;
                            if ((value) && (inputType != typeof value)) {
                                if (inputType === 'boolean') {
                                    value = !!value;
                                } else if ((inputType instanceof Array) && (typeof value === 'string')) {
                                    value = [value];
                                } else {
                                    console.error('Type mismatch between' + inputData.default + ' and ' + value);
                                }
                            }
                            let options = inputData?.options;
                            if (options) {
                                if (inputType === 'string') {
                                    if (!options.find(i => i.value === value)) options.push({name: value, value});
                                } else if (inputType != 'boolean') value.forEach(i => {
                                    if (!options.find(j => j.value === i)) options.push({name: i, value: i});
                                });
                            }
                            inputs.push ({
                                default: inputData.default,
                                id: current,
                                name: current,
                                type: inputData.type,
                                options,
                                value: value ?? inputData.default
                            });
                        } else {
                            inputs.push({
                                id: 'content-' + i,
                                name: 'content-' + i,
                                type: 'content',
                                value: current,
                                class: 'quick-conditions-div-content'
                            });
                        }
                    }
                    terms[i] = {
                        id: conditionKey,
                        class: 'quick-conditions-group-condition cpr-row-center',
                        inputs
                    };
                    terms.splice(i + 1, 0, {
                        id: conditionKey + '-remove',
                        class: 'quick-conditions-group-condition-remove',
                        inputs: [{
                            id: 'remove-' + i,
                            name: 'remove-' + i,
                            type: 'button',
                            icon: 'fa-solid fa-minus',
                            class: 'quick-conditions-button-remove',
                            dataAction: 'remove'
                        }]
                    });
                    i++;
                } else {
                    terms[i] = {
                        id: term + '-text',
                        class: 'quick-conditions-group-condition cpr-row-center',
                        inputs: [{
                            id: 'text-' + i,
                            name: 'text-' + i,
                            type: 'text',
                            value: term,
                            class: 'quick-conditions-div-text',
                            tooltip: 'CHRISPREMADES.QuickConditions.Unknown.Tooltip'
                        }]
                    };
                }
            }
        }
        return terms;
    }
    findCondition(term) {
        let conditions = this.conditions;
        let foundKey;
        conditions.entries().forEach(([key, value]) => {
            if (term.includes(value.searchKey)) foundKey = key;
        });
        if (foundKey) {
            let condition = conditions.get(foundKey);
            this.foundCondition = condition;
            this.activateCondition(foundKey);
            return [condition, foundKey];
        } else {
            this.foundCondition = undefined;
            return [false, false];
        }
    }
    safeParse(string) {
        if ((typeof string != 'string') || (!string.includes('['))) return string;
        try {
            return JSON.parse(string);
        } catch {
            console.error(string + ' is not parseable');
        }
        return string;
    }
    set terms(value) {
        this.value = this.stringifyTerms(value);
        let el = this.element.querySelector('#conditionValue');
        el.value = this.value;
    }
    stringifyTerms(value) {
        let newValue = '';
        value.forEach(term => {
            if (!term.id.includes('remove')) {
                if (term.id.includes('logic')) {
                    newValue += ` ${term.inputs[0].value} `;
                } else if (term.id.includes('text')) {
                    newValue += ` ${term.inputs[0].value} `;
                } else {
                    let condition = this.activeConditions.get(term.id);
                    let baseArray = condition.format.split(/\$([a-zA-Z_][a-zA-Z0-9_]*)/).filter(Boolean);
                    // Using the baseArray to format what's added to the newValue
                    baseArray.map(i => {
                        let placeholderValue = term.inputs.find(j => j.id === i);
                        if (placeholderValue) {
                            // Stringify array otherwise match the value to the name
                            if (placeholderValue.value instanceof Array) {
                                newValue += JSON.stringify(placeholderValue.value);
                            } else {
                                if ([true, false, 'true', 'false'].includes(placeholderValue.value)) {
                                    newValue += placeholderValue.options.find(j => String(j.value) == String(placeholderValue.value))?.name;
                                } else {
                                    newValue += placeholderValue.value;
                                }
                            }
                        } else {
                            // Not a placeholder, just content
                            newValue += i;
                        }
                    });
                }
            }
        });
        return newValue;
    }
    /* Regular ol'getters */
    get title() {
        return this.windowTitle;
    }
    get context() {
        return this._context;
    }
    set context(value) {
        this._context = value;
    }
    get conditions() {
        return this._conditions;
    }
    set conditions(value) {
        this._conditions = value;
    }
    get foundCondition() {
        return this._foundCondition;
    }
    set foundCondition(value) {
        this._foundCondition = value;
    }
    /* Track active/inactive conditions to have slightly less to parse through */
    get activeConditions() {
        return this._activeConditions;
    }
    get inactiveConditions() {
        return this._inactiveConditions;
    }
    activateCondition(value) {
        let inactiveCondition = this._inactiveConditions.get(value);
        if (!inactiveCondition) return;
        this._activeConditions.set(value, inactiveCondition);
        this._inactiveConditions.delete(value);
    }
    inactivateCondition(value) {
        let activeCondition = this._activeConditions.get(value);
        if (!activeCondition) return;
        this._inactiveConditions.set(value, activeCondition);
        this._activeConditions.delete(value);
    }
    /* Form bits */
    makeButton(label, name) {
        return {type: 'submit', action: 'confirm', label: label, name: name};
    }
    formatInputs() {
        let context = {};
        context.data = {
            data: {
                value: this.value,
                placeholder: 'CHRISPREMADES.QuickConditions.Placeholder'
            }
        };
        context.inputs = {
            edit: this.terms,
            add: Array.from(this.inactiveConditions.keys()).map(key => ({
                id: key,
                name: key,
                type: 'button',
                class: 'quick-conditions-button-add',
                dataAction: 'add',
                label: key
            }))
        };
        context.buttons = [this.makeButton('CHRISPREMADES.Generic.Ok', 'true'), this.makeButton('CHRISPREMADES.Generic.Cancel', 'false')];
        this.context = context;
    }
    async _prepareContext(options) {
        this.formatInputs();
        let context = this.context;
        return context;
    }
    async _onChangeForm(formConfig, event) {
        // Variables from the event
        let targetInput = event.target;
        let groupId = targetInput.closest('div').id;
        let inputId = targetInput.id;
        let value = targetInput.value;
        // Find and change input value
        let currentContext = this.context;
        let inputs = currentContext.inputs.edit;
        let group = inputs.find(i => i.id === groupId);
        if (group) {
            let input = group.inputs.find(i => i.id === inputId);
            if (input) input.value = value;
        }
        // Update this.value
        this.terms = currentContext.inputs.edit;
        this.context = currentContext;
    }
}