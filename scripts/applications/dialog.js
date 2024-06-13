let {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;

/**
 * @param {string} title Dialog Window Title
 * @param {string} content Content placed above the Dialog inputs
 * @param {Array} inputs Form parts of the dialog
 * // ['inputType', [{label: 'label', name: 'name', options: {}}]]
 * @param {string} buttons String corresponding to localized buttons to confirm/cancel dialog
 * // 'yesNo', 'okayCancel'
 * 
 * 
 * 
 */
/*  
[
    ['button', [{label: 'label', name: 'name'}], {displayVertical}],
    ['checkbox', [{label: 'label', name: 'name', {isChecked, image}}], {displayVertical}],
    ['radio', [{label: 'label', name: 'name', {isChecked, image}}], {radioName displayVertical}],
    ['selectAmount', [{label: 'label', name: 'name', {minAmount, maxAmount, currentAmount, weight, image}}], {totalMax, displayVertical}],
    ['selectOption', [{label: 'label', name: 'name', {options, currentValue, image}}], {displayVertical}],
    ['text', [{label: 'label', name: 'name', {currentValue, image}}], {displayVertical}],
    ['number', [{label: 'label', name: 'name', {currentValue, image}}], {displayVertical}],
    ['filePicker', [{label: 'label', name: 'name', {currentValue, type}}], {displayVertical}],
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
                    name: 'pie'
                }, {
                    label: 'Cake',
                    name: 'cake',
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
                    name: 'agree'
                }, {
                    label: 'I disagree',
                    name: 'disagree',
                    options: {
                        isChecked: true
                    }
                }
            ]
        ],
        [
            'selectAmount', 
            [
                {
                    label: 'How Many Cakes',
                    name: 'howManyCakes',
                    options: {
                        minAmount: 0,
                        maxAmount: 10,
                        currentAmount: 1,
                        weight: 1
                    }
                }, {
                    label: 'How Many Pies?',
                    name: 'howManyPies',
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
                    name: 'likeCake',
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
                    name: 'likePie',
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
                    name: 'image',
                    options: {
                        type: 'image'
                    }
                }
            ]
        ],
        [
            'button',
            [
                {
                    label: "I have a picture!",
                    name: 'myButton',
                    options: {
                        displayAsRows: true,
                        image: 'icons/creatures/magical/humanoid-horned-rider.webp'
                    }
                }
            ]
        ]
    ],
    'okCancel'
)

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
            let [title, content, inputs, buttons, config] = options;
            this.position.width = config?.width ?? 'auto';
            this.position.height = config?.height ?? 'auto';
            this.windowTitle = title,
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
            resizable: true,
        }
    };
    static PARTS = {
        form: {
            template: 'modules/chris-premades/templates/dialogApp.hbs'
        },
        footer: {
            template: 'modules/chris-premades/templates/form-footer.hbs'
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
        if (name == false) {
            this.submit(false);
            return false;
        }
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
                        options: checkboxOptions
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
                case 'selectOption': {
                    let selectOptions = [];
                    for (let currField of inputFields) {
                        selectOptions.push({
                            label: currField.label, 
                            name: currField.name,
                            currentValue: currField.options?.currentValue ?? 'none',
                            options: currField.options?.options ?? ['none'],
                            image: currField.options?.image ?? undefined});
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
        let targetInputId = JSON.parse(targetInput.id);
        switch (targetInput.type) {
            case 'checkbox': {
                currentContext.inputs[targetInputId[0]].options[targetInputId[1]].isChecked = targetInput.checked;
                break;
            }
            case 'select-one': {
                if (currentContext.inputs[targetInputId[0]].isSelectAmount) {
                    currentContext.inputs[targetInputId[0]].options[targetInputId[1]].currentAmount = Number(targetInput.value);
                    if (currentContext.inputs[targetInputId[0]].options[targetInputId[1]]?.weight) {
                        currentContext.inputs[targetInputId[0]] = this.currentMaxAmounts(currentContext.inputs[targetInputId[0]]);
                    }
                } else {
                    currentContext.inputs[targetInputId[0]].options[targetInputId[1]].value = targetInput.value;
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
            }
        }
        if (targetInput.localName === 'file-picker') {
            currentContext.inputs[targetInputId[0]].options[targetInputId[1]].value = targetInput.value;
        }
        this.context = currentContext;
        this.render(true);
    }
    _onRender(context, options) {
        //let imageElements = this.element.querySelectorAll('.label-image');
        //imageElements[0].addEventListener('click', async (e) => {
        //console.log(e.target);
        // Sensible way to get the parent button's 'name'
        // let id = ^
        // let tok = canvas.tokens.get(id);
        // if (tok) await canvas.ping(tok.document.object.center);
        //});
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