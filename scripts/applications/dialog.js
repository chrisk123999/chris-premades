import {genericUtils} from '../utils.js';
let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
export class DialogApp extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options) {
        let title, content, inputs, buttons, config;
        if (options?.length) {
            [title, content, inputs, buttons, config] = options;
        }
        if (config?.id) {
            super({id: config.id});
        } else {
            super();
        }
        if (options?.length) {
            this.position.width = config?.width ?? 'auto';
            this.position.height = config?.height ?? 'auto';
            this.windowTitle = game.i18n.localize(title),
            this.content = content,
            this.inputs = inputs,
            this.buttons = buttons,
            this.buttonTemplate = {
                type: 'submit',
                label: 'label',
                name: 'name',
                action: 'confirm'
            };
        }
    }
    static DEFAULT_OPTIONS = {
        tag: 'form',
        form: {
            handler: DialogApp.formHandler,
            submitOnChange: false,
            closeOnSubmit: false,
            id: 'dialog-app-window'
        },
        actions: {
            confirm: DialogApp.confirm
        },
        window: {
            title: 'Default Title',
            //resizable: true,
        }
    };
    static PARTS = {
        form: {
            template: 'modules/chris-premades/templates/dialogApp.hbs',
            scrollable: ['']
        },
        footer: {
            template: 'modules/chris-premades/templates/form-footer.hbs'
        }
    };
    /** 
     * Main function of the class, creates a new dialog in itself so that it can wrap the submission in a promise in order to await a result
     * @param {title, content, inputs, buttons, options} options
         * @param {string} title Dialog Window Title
         * @param {string} content Content placed above the Dialog inputs
         * @param {Array} inputs Form parts of the dialog
         * [typeOfField, [fields], globalOptionsForThisField]
         * @param {string} buttons String corresponding to localized buttons to confirm/cancel dialog
         * 'yesNo' or 'okayCancel'
     */
    /**
     * 
     * Possible values for `inputs`
     * [
     *     ['button', [{label: 'label', name: 'name'}], options: {displayAsRows}],
     *     ['checkbox', [{label: 'label', name: 'name', options: {isChecked, image}}], {displayAsRows}],
     *     ['radio', [{label: 'label', name: 'name', options: {isChecked, image}}], {radioName, displayAsRows}],
     *     ['selectAmount', [{label: 'label', name: 'name', options: {minAmount, maxAmount, currentAmount, weight, image}}], {totalMax, displayAsRows}],
     *     ['selectOption', [{label: 'label', name: 'name', options: {options, currentValue, image}}], {displayAsRows}],
     *     ['text', [{label: 'label', name: 'name', options: {currentValue, image}}], {displayAsRows}],
     *     ['number', [{label: 'label', name: 'name', options: {currentValue, image}}], {displayAsRows}],
     *     ['filePicker', [{label: 'label', name: 'name', options: {currentValue, type}}], {displayAsRows}],
     * ] 
     */
    static async dialog(...options) {
        return new Promise((resolve) => {
            const dialog = new DialogApp(options);
            dialog.addEventListener('close', () => {
                resolve(null);
            }, {once: true});
            dialog.render({force: true});
            dialog.submit = async result => {
                resolve(result);
                dialog.close();
            };
        });
    }
    // Add results to the object to be handled elsewhere
    static async formHandler(event, form, formData) {
        this.results = foundry.utils.expandObject(formData.object);
    }
    // Takes the button results, passes it to be merged with formData
    static async confirm(event, target) {
        await this.mergeResults(target.name);
    }
    async mergeResults(name) {
        if (name === 'false') {
            this.submit({buttons: false});
            return false;
        }
        while (this.results === undefined) {
            await new Promise((resolve) => {
                setTimeout(resolve, 10);
            });
        }
        if (name === 'true') {
            this.results.buttons = true;
        } else {
            this.results.buttons = name;
        }
        this.submit(this.results);
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
    // Helper for formatting buttons
    makeButton(label, name) {
        return {type: 'submit', action: 'confirm', label: label, name: name};
    }
    makeArray(firstNum, lastNum) {
        let array = [];
        for (let i = firstNum; i < (lastNum + 1); i++) {
            array.push(i);
        }
        return array;
    }
    // Formats content from the passed inputs, only run once
    formatInputs() {
        let context = {};
        context.content = this.content;
        context.inputs = [];
        context.buttons = [];
        for (let [inputType, inputFields, inputOptions] of this.inputs) {
            switch (inputType) {
                case 'button': {
                    let buttonOptions = [];
                    for (let currField of inputFields) {
                        buttonOptions.push({
                            label: currField.label,
                            name: currField.name,
                            image: currField.options?.image ?? undefined,
                            tooltip: currField.options?.tooltip ?? undefined,
                        });
                    }
                    context.inputs.push({
                        isButton: true,
                        displayAsRows: inputOptions?.displayAsRows ?? false,
                        options: buttonOptions
                    });
                    break;
                }
                case 'checkbox': {
                    let checkboxOptions = [];
                    for (let currField of inputFields) {
                        checkboxOptions.push({
                            label: currField.label, 
                            name: currField.name, 
                            isChecked: currField.options?.isChecked ?? false, 
                            image: currField.options?.image ?? undefined
                        });
                    }
                    context.inputs.push({
                        isCheckbox: true,
                        displayAsRows: inputOptions?.displayAsRows ?? false,
                        options: checkboxOptions,
                        totalMax: inputOptions?.totalMax ?? 99,
                        currentNum: 1
                    });
                    break;
                } 
                case 'radio': {
                    let radioOptions = [];
                    for (let currField of inputFields) {
                        radioOptions.push({
                            label: currField.label, 
                            name: currField.name, 
                            isChecked: currField.options?.isChecked ?? false, 
                            image: currField.options?.image ?? undefined
                        });
                    }
                    context.inputs.push({
                        isRadio: true,
                        displayAsRows: inputOptions?.displayAsRows ?? false,
                        options: radioOptions,
                        radioName: inputOptions?.radioName ?? 'radio',
                    });
                    break;
                }
                case 'selectAmount': {
                    let selectAmounts = [];
                    for (let currField of inputFields) {
                        selectAmounts.push({
                            label: currField.label, 
                            name: currField.name,
                            minAmount: currField.options?.minAmount ?? 0,
                            maxAmount: currField.options?.maxAmount ?? 10, 
                            currentAmount: currField.options?.currentAmount ?? 0,
                            currentMaxAmount: currField.options?.maxAmount ?? 10,
                            weight: currField.options?.weight ?? 1,
                            options: this.makeArray(currField.options?.minAmount ?? 0, currField.options?.maxAmount ?? 10),
                            image: currField.options?.image ?? undefined});
                    }
                    context.inputs.push({
                        isSelectAmount: true,
                        totalMax: inputOptions?.totalMax,
                        displayAsRows: inputOptions?.displayAsRows ?? false,
                        options: selectAmounts
                    });
                    break;
                }
                case 'selectMany': {
                    let selectOptions = [];
                    for (let currField of inputFields) {
                        selectOptions.push({
                            label: currField.label, 
                            name: currField.name,
                            value: currField.options?.value ?? [],
                            options: currField.options?.options?.map(i => ({
                                label: i.label,
                                value: i.value,
                                isSelected: (currField.options?.value ?? []).includes(i.value)
                            })) ?? {},
                            image: currField.options?.image ?? undefined
                        });
                    }
                    context.inputs.push({
                        isSelectMany: true,
                        displayAsRows: inputOptions?.displayAsRows ?? false,
                        options: selectOptions
                    });
                    break;
                }
                case 'selectOption': {
                    let selectOptions = [];
                    for (let currField of inputFields) {
                        selectOptions.push({
                            label: currField.label, 
                            name: currField.name,
                            currentValue: currField.options?.currentValue ?? 'none',
                            options: currField.options?.options ?? ['none'],
                            image: currField.options?.image ?? undefined
                        });
                    }
                    context.inputs.push({
                        isSelectOption: true,
                        displayAsRows: inputOptions?.displayAsRows ?? false,
                        options: selectOptions
                    });
                    break;
                }
                case 'text': {
                    let textOptions = [];
                    for (let currField of inputFields) {
                        textOptions.push({
                            label: currField.label, 
                            name: currField.name,
                            value: currField.options?.currentValue ?? '',
                            image: currField.options?.image ?? undefined
                        });
                    }
                    context.inputs.push({
                        isText: true,
                        displayAsRows: inputOptions?.displayAsRows ?? false,
                        options: textOptions
                    });
                    break;
                }
                case 'number': {
                    let numberOptions = [];
                    for (let currField of inputFields) {
                        numberOptions.push({
                            label: currField.label, 
                            name: currField.name,
                            value: currField.options?.currentValue ?? 0,
                            image: currField.options?.image ?? undefined
                        });
                    }
                    context.inputs.push({
                        isNumber: true,
                        displayAsRows: inputOptions?.displayAsRows ?? false,
                        options: numberOptions
                    });
                    break;
                }
                case 'filePicker': {
                    let filePickerOptions = [];
                    for (let currField of inputFields) {
                        filePickerOptions.push({
                            label: currField.label, 
                            name: currField.name,
                            value: currField.options?.currentValue ?? '',
                            type: currField.options?.type ?? 'any' // FilePicker.FILE_TYPES => ['image', 'audio', 'video', 'text', 'imagevideo', 'font', 'folder', 'any']
                        });
                    }
                    context.inputs.push({
                        isFilePicker: true,
                        displayAsRows: inputOptions?.displayAsRows ?? false,
                        options: filePickerOptions
                    });
                    break;
                }
            }
        }
        switch (this.buttons) {
            case 'yesNo': context.buttons.push(this.makeButton('CHRISPREMADES.Generic.Yes', 'true'), this.makeButton('CHRISPREMADES.Generic.No', 'false'));
                break;
            case 'okCancel': context.buttons.push(this.makeButton('CHRISPREMADES.Generic.Ok', 'true'), this.makeButton('CHRISPREMADES.Generic.Cancel', 'false'));
                break;
        }
        this.context = context;
    }
    // Formats inputs if context store is nullish, otherwise takes the current context store
    async _prepareContext(options) {
        if (!this.context) this.formatInputs();
        let context = this.context;
        return context;
    }
    // Does the math to make the selectAmount fields not able to select more than their combined max
    currentMaxAmounts(input) {
        let currentContextInput = foundry.utils.deepClone(input);
        let max = currentContextInput.totalMax;
        currentContextInput.options.forEach(option => max -= option.currentAmount * option.weight);
        for (let i of currentContextInput.options) {
            i.currentMaxAmount = Math.floor((max + (i.currentAmount * i.weight)) / i.weight);
        }
        return currentContextInput;
    }
    // Handles changes to the form, checkbox marks etc, updates the context store and forces a re-render
    async _onChangeForm(formConfig, event) {
        let targetInput = event.target;
        let currentContext = this.context;
        let targetInputIdString = targetInput.id.match(/i(\d+)j(\d+)/);
        let targetInputId = [parseInt(targetInputIdString[1]), parseInt(targetInputIdString[2])];
        switch (targetInput.type) {
            case 'checkbox': {
                currentContext.inputs[targetInputId[0]].options[targetInputId[1]].isChecked = targetInput.checked;
                let numChecked = currentContext.inputs[targetInputId[0]].options.reduce((acc, checkbox) => checkbox.isChecked ? acc + 1 : acc, 0);
                currentContext.inputs[targetInputId[0]].currentNum = numChecked;
                break;
            }
            case 'select-one': {
                if (currentContext.inputs[targetInputId[0]].isSelectAmount) {
                    currentContext.inputs[targetInputId[0]].options[targetInputId[1]].currentAmount = Number(targetInput.value);
                    if (currentContext.inputs[targetInputId[0]].options[targetInputId[1]]?.weight) {
                        currentContext.inputs[targetInputId[0]] = this.currentMaxAmounts(currentContext.inputs[targetInputId[0]]);
                    }
                } else {
                    currentContext.inputs[targetInputId[0]].options[targetInputId[1]].currentValue = targetInput.value;
                }
                break;
            }
            case 'text': {
                currentContext.inputs[targetInputId[0]].options[targetInputId[1]].value = targetInput.value;
                break;
            }
            case 'radio': {
                currentContext.inputs[targetInputId[0]].options.forEach(currOpt => currOpt.isChecked = false);
                currentContext.inputs[targetInputId[0]].options[targetInputId[1]].isChecked = targetInput.checked;
                break;
            }
            case 'number': {
                currentContext.inputs[targetInputId[0]].options[targetInputId[1]].value = targetInput.value;
                break;
            }
            default: {
                if (event.target.tagName?.toLowerCase() === 'multi-select') {
                    currentContext.inputs[targetInputId[0]].options[targetInputId[1]].value = targetInput.value;
                    currentContext.inputs[targetInputId[0]].options[targetInputId[1]].options.forEach(i => targetInput.value.includes(i.value) ? i.isSelected = true : i.isSelected = false);
                }
                break;
            }
        }
        if (targetInput.localName === 'file-picker') {
            currentContext.inputs[targetInputId[0]].options[targetInputId[1]].value = targetInput.value;
        }
        this.context = currentContext;
        this.render(true);
    }
    _onRender(context, options) {
        let imageElements = this.element.querySelectorAll('.label-image');
        for (let currElem of imageElements) {
            let targetInputIdString = currElem.parentElement.getAttribute('for').match(/i(\d+)j(\d+)/);
            let [inputIndex, optionIndex] = [parseInt(targetInputIdString[1]), parseInt(targetInputIdString[2])];
            let currId = context.inputs[inputIndex].options[optionIndex].name;
            currElem.addEventListener('click', async function() {
                let targetToken = canvas.tokens.get(currId);
                if (!targetToken) return;
                await canvas.ping(targetToken.center);
            });
            currElem.addEventListener('mouseover', function() {
                let targetToken = canvas.tokens.get(currId);
                if (!targetToken) return;
                targetToken.hover = true;
                targetToken.refresh();
            });
            currElem.addEventListener('mouseout', function() {
                let targetToken = canvas.tokens.get(currId);
                if (!targetToken) return;
                targetToken.hover = false;
                targetToken.refresh();
            });
        }
    }
}
export class DialogManager {
    constructor() {
        this.dialogQueue = Promise.resolve();
    }
    async showDialog(dialogFunction, ...args) {
        await this.dialogQueue;
        await genericUtils.sleep(500);
        let dialogPromise = dialogFunction(...args);
        this.dialogQueue = dialogPromise;
        return dialogPromise;
    }
}