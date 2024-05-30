let { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * @param {string} title Dialog Window Title
 * @param {string} content Content placed above the Dialog inputs
 * @param {Array} inputs Form parts of the dialog
 * // [['inputType', [['Label', value, options: {}]]]]
 * @param {string} buttons String corresponding to localized buttons to confirm/cancel dialog
 * // 'yesNo', 'okayCancel'
 * 
 * 
 * 
 */
/*  
[
    ['button', [['label', value]], {displayVertical}],
    ['checkbox', [['label', value, {isChecked, image}]], {displayVertical}],
    ['radio', [['label', value, {isSelected, image}]], {displayVertical}],
    ['select', [['label', value, {minAmount, maxAmount, currentAmount, weight, image}]], {totalMax, displayVertical}],
    ['text', [['label', value, {currentValue, image}]], {displayVertical}],
    ['number', [['label', value, {currentValue, image}]], {displayVertical}],
    ['filePicker', [['label', value, {currentValue, type}]], {displayVertical}],
]

Format is an array containing: [typeOfField, [fields], globalOptionsForThisField]

await chrisPremades.DialogApp.dialog(
    'Desert Survey', 
    'Do you like Pie or Cake?', 
    [
        [
            'checkbox', 
            [
                {
                    label: 'Pie',
                    value: 'pie'
                }, {
                    label: 'Cake',
                    value: 'cake',
                    options: {
                        isChecked: true
                    }
                }
            ]
        ],
        [
            'radio', 
            [
                {
                    label: 'I agree',
                    value: 'agree'
                }, {
                    label: 'I disagree',
                    value: 'disagree',
                    options: {
                        isSelected: true
                    }
                }
            ]
        ],
        [
            'select', 
            [
                {
                    label: 'How Many Cakes',
                    value: 'howManyCakes',
                    options: {
                        minAmount: 0,
                        maxAmount: 10,
                        currentAmount: 1,
                        weight: 1
                    }
                }, {
                    label: 'How Many Pies?',
                    value: 'howManyPies',
                    options: {
                        minAmount: 0,
                        maxAmount: 5,
                        currentAmount: 1,
                        weight: 2
                    }
                }
            ],
            {
                totalMax: 10
            }
        ],
        [
            'text', 
            [
                {
                    label: 'How much do you like cake?',
                    value: 'likeCake',
                    options: {
                        currentValue: 'I really like it'
                    }
                }
            ]
        ],
        [
            'number', 
            [
                {
                    label: 'On a scale of one to ten, how much do you like pie?',
                    value: 'likePie',
                    options: {
                        currentValue: 5
                    }
                }
            ],
            {
                displayAsRows: true
            }
        ],
        [
            'filePicker', 
            [
                {
                    label: 'What does your cake look like?',
                    value: '',
                    options: {
                        type: 'image'
                    }
                }
            ]
        ]
    ],
    'okCancel'
).render(true)

buttonDialog(title, content, buttons)
// ('My Dialog', 'This is a dialog', ['Cool', true])
button, checkbox, radio, select, text, number, filePicker
    dialog - 203 - buttons, select one
    numberDialog - external, 1 number input, ok cancel
    selectTarget - 44 - check box, ok cancel
    remoteDialog - 15
    menu - 19
    remoteMenu - 5
    remoteSelectTarget - 1
    selectDocument - 32 - fancy button
    selectDocuments - 4 - fancy w checkbox
    remoteDocumentDialog - 6
    remoteDocumentsDialog - 4
        useSpellWhenEmpty - 1

*/

export class DialogApp extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options) {
        super();
        if (options?.length > 0) {
            let [title, content, inputs, buttons] = options;
            this.windowTitle = title,
            this.content = content,
            this.inputs = inputs,
            this.buttons = buttons,
            this.buttonTemplate = {
                type: 'submit',
                label: 'label',
                name: 'value',
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
        },
        actions: {
            confirm: DialogApp.confirm
        },
        window: {
            title: 'Default Title'
        }
    };
    static PARTS = {
        form: {
            template: 'modules/chris-premades/templates/dialogApp.hbs'
        },
        footer: {
            template: 'templates/generic/form-footer.hbs'
        }
    };
    /** 
     * Main function of the class, creates a new dialog in itself so that it can wrap the submission in a promise in order to await a result
     * @param {title, content, inputs, buttons} options
     */
    static async dialog(...options) {
        return new Promise((resolve) => {
            const dialog = new DialogApp(options);
            dialog.addEventListener('close', () => {
                resolve(null);
            }, { once: true });
            dialog.render({ force: true });
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
        if (name === false) this.submit(false);
        while (this.results === undefined) {
            await new Promise((resolve) => {
                setTimeout(resolve, 10);
            });
        }
        this.results.buttons = name;
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
    makeButton(label, value) {
        return {type: 'submit', action: 'confirm', label: label, name: value};
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
                case 'button': 
                    inputFields.forEach(([label, value]) => context.buttons.push(this.makeButton(label, value)));
                    break;
                case 'checkbox': {
                    let checkboxOptions = [];
                    for (let currField of inputFields) {
                        checkboxOptions.push({
                            label: currField.label, 
                            value: currField.value, 
                            isChecked: currField.options?.isChecked ?? false, 
                            image: currField.options?.image ?? undefined
                        });
                    }
                    context.inputs.push({
                        isCheckbox: true,
                        displayAsRows: inputOptions?.displayAsRows ?? false,
                        options: checkboxOptions
                    });
                    break;
                } 
                case 'radio': {
                    let radioOptions = [];
                    for (let currField of inputFields) {
                        radioOptions.push({
                            label: currField.label, 
                            value: currField.value, 
                            isSelected: currField.options?.isSelected ?? false, 
                            image: currField.options?.image ?? undefined
                        });
                    }
                    context.inputs.push({
                        isRadio: true,
                        displayAsRows: inputOptions?.displayAsRows ?? false,
                        options: radioOptions
                    });
                    break;
                }
                case 'select': {
                    let selectOptions = [];
                    for (let currField of inputFields) {
                        selectOptions.push({
                            label: currField.label, 
                            value: currField.value,
                            minAmount: currField.options?.minAmount ?? 0,
                            maxAmount: currField.options?.maxAmount ?? 10, 
                            currentAmount: currField.options?.currentAmount ?? 0,
                            weight: currField.options?.weight,
                            options: this.makeArray(currField.options?.minAmount ?? 0, currField.options?.maxAmount ?? 10),
                            image: currField.options?.image ?? undefined});
                    }
                    context.inputs.push({
                        isSelect: true,
                        totalMax: inputOptions?.totalMax,
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
                            id: currField.value,
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
                            id: currField.value,
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
                            id: currField.value,
                            value: currField.options?.currentValue ?? 0,
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
            case 'yesNo': context.buttons.push(this.makeButton('CHRISPREMADES.Yes', 'true'), this.makeButton('CHRISPREMADES.No', 'false'));
                break;
            case 'okCancel': context.buttons.push(this.makeButton('CHRISPREMADES.Ok', 'true'), this.makeButton('CHRISPREMADES.Cancel', 'false'));
                break;
        }
        this.context = context;
    }
    // Formats inputs if context store is nullish, otherwise takes the current context store
    async _prepareContext(options) {
        if (!this.context) this.formatInputs();
        let context = this.context;
        console.log(context);
        return context;
    }
    // Handles changes to the form, checkbox marks etc, updates the context store and forces a re-render
    async _onChangeForm(formConfig, event) {
        let targetInput = event.target;
        let currentContext = this.context;
        let targetInputId = JSON.parse(targetInput.id);    
        console.log('Form is changing', formConfig, event);
        console.log(event.target, event.target.name, event.target.checked, event.target.type, event.target.id);
        switch (targetInput.type) {
            case 'checkbox':
                currentContext.inputs[targetInputId[0]].options[targetInputId[1]].isChecked = targetInput.checked;
                break;
            case 'select-one':
                // Note this only works for select dropdowns that contain numbers, because that's how they're all treated so far
                currentContext.inputs[targetInputId[0]].options[targetInputId[1]].currentAmount = Number(targetInput.value);
                break;
            case 'text':
                currentContext.inputs[targetInputId[0]].options[targetInputId[1]].value = targetInput.value
                break;
            case 'radio':
                currentContext.inputs[targetInputId[0]].options.forEach(currOpt => currOpt.isSelected = false);
                currentContext.inputs[targetInputId[0]].options[targetInputId[1]].isSelected = targetInput.checked
                break;
        }
        this.context = currentContext;
        this.render(true);
    }
    /**
     * @override Was getting an error without this, only copy-pasted parts from the super, presumably out of HandlebarsMixin
     */
    _replaceHTML(result, content, options) {
        for ( const [partId, htmlElement] of Object.entries(result) ) {
            const priorElement = content.querySelector(`[data-application-part="${partId}"]`);
            if ( priorElement ) {
                priorElement.replaceWith(htmlElement);
            }
        }
        return super._replaceHTML(result, content, options);
    }
}