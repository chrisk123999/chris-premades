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
    ['button', [['label', value]],
    ['checkbox', [['label', value, {isChecked, image}]],
    ['radio', [['label', value, {isSelected, image}]]],
    ['select', [['label', value, {minAmount, maxAmount, currentAmount, weight, image}]], {totalMax}],
    ['text', [['label', value, {currentValue, image}]]],
    ['number', [['label', value, {currentValue, image}]]],
    ['filePicker', [['label', value, {currentValue, type}]]],
]

await chrisPremades.DialogApp.dialog(
    'Desert Survey', 
    'Do you like Pie or Cake?', 
    [
        ['checkbox', [['Pie', 'pie'], ['Cake', 'cake', true]]],
        ['radio', [['I agree', 'agree'], ['I disagree', 'diagree', true]]],
        ['select', [
            ['How Many Cakes?', 'howManyCakes', {minAmount: 0, maxAmount: 10, currentAmount: 1, weight: 1}], 
            ['How Many Pies?', 'howManyPies', {minAmount: 0, maxAmount: 5, currentAmount: 1, weight: 2}]],
            {totalMax: 10}
        ],
        ['text', [['How much do you like cake?', 'likeCake', {currentValue: 'I really like it'}]]],
        ['number', [['On a scale of one to ten, how much do you like pie?', 'likePie', {currentValue: 5}]]],
        ['filePicker', [['What does your cake look like?', '', {type: 'image'}]]]
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
        for (let i of this.inputs) {
            switch (i[0]) {
                case 'button': 
                    i[1].forEach(([label, value]) => context.buttons.push(this.makeButton(label, value)));
                    break;
                case 'checkbox': {
                    let checkboxOptions = [];
                    for (let j of i[1]) {
                        checkboxOptions.push({
                            label: j[0], 
                            value: j[1], 
                            isChecked: j?.[2]?.isChecked ?? false, 
                            image: j?.[2]?.image ?? undefined
                        });
                    }
                    context.inputs.push({
                        isCheckbox: true,
                        options: checkboxOptions
                    });
                    break;
                } 
                case 'radio': {
                    let radioOptions = [];
                    for (let j of i[1]) {
                        radioOptions.push({
                            label: j[0], 
                            value: j[1], 
                            isSelected: j?.[2]?.isSelected ?? false, 
                            image: j?.[2]?.image ?? undefined
                        });
                    }
                    context.inputs.push({
                        isRadio: true,
                        options: radioOptions
                    });
                    break;
                }
                case 'select': {
                    let selectOptions = [];
                    for (let j of i[1]) {
                        selectOptions.push({
                            label: j[0], 
                            value: j[1],
                            minAmount: j?.[2]?.minAmount ?? 0,
                            maxAmount: j?.[2]?.maxAmount ?? 10, 
                            currentAmount: j?.[2]?.currentAmount ?? 0,
                            weight: j?.[2]?.weight,
                            options: this.makeArray(j?.[2]?.minAmount ?? 0, j?.[2]?.maxAmount ?? 10),
                            image: j?.[2]?.image ?? undefined});
                    }
                    context.inputs.push({
                        isSelect: true,
                        totalMax: i[2]?.totalMax,
                        options: selectOptions
                    });
                    break;
                }
                case 'text': {
                    let textOptions = [];
                    for (let j of i[1]) {
                        textOptions.push({
                            label: j[0], 
                            id: j[1],
                            value: j?.[2]?.currentValue ?? '',
                            image: j?.[2]?.image ?? undefined
                        });
                    }
                    context.inputs.push({
                        isText: true,
                        options: textOptions
                    });
                    break;
                }
                case 'number': {
                    let numberOptions = [];
                    for (let j of i[1]) {
                        numberOptions.push({
                            label: j[0], 
                            id: j[1],
                            value: j?.[2]?.currentValue ?? 0,
                            image: j?.[2]?.image ?? undefined
                        });
                    }
                    context.inputs.push({
                        isNumber: true,
                        options: numberOptions
                    });
                    break;
                }
                case 'filePicker': {
                    let filePickerOptions = [];
                    for (let j of i[1]) {
                        filePickerOptions.push({
                            label: j[0], 
                            id: j[1],
                            value: j?.[2]?.currentValue ?? 0,
                            type: j?.[2]?.type ?? 'any' // FilePicker.FILE_TYPES => ['image', 'audio', 'video', 'text', 'imagevideo', 'font', 'folder', 'any']
                        });
                    }
                    context.inputs.push({
                        isFilePicker: true,
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