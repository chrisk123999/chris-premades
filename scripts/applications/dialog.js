let { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

/**
 * @param {string} title Dialog Window Title
 * @param {string} content Content placed above the Dialog inputs
 * @param {Array} inputs Form parts of the dialog
 * // [{'inputType': [['Label', value, options: {'isDefault': true, 'weight': 1}, options: {'max': number}]]}]
 * @param {string} buttons String corresponding to localized buttons to confirm/cancel dialog
 * // 'yesNo', 'okayCancel'
 * 
 * 
 * 
 */
/*  
[
    ['button', [['Label 1', value1], ['Label 2', value2]]],
    {'checkbox': [['Label 1', value1, true], ['Label 2', value2]]},
    {'select': [['Label 1', ]]}

]

await new chrisPremades.DialogApp('Title', 'This is a dialog', [['checkbox', [['I agree', 'agree'], ['I disagree', 'diagree', true]]]], 'okCancel').render(true)

buttonDialog(title, content, buttons)
// ('My Dialog', 'This is a dialog', ['Cool', true])
button, checkbox, radio, select, text, number, filebrowser
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
            }
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
    }
    static PARTS = {
        form: {
            template: 'modules/chris-premades/templates/dialogApp.hbs'
        },
        footer: {
            template: 'templates/generic/form-footer.hbs'
        }
    }
    static async formHandler(event, form, formData) {
        this.results = foundry.utils.expandObject(formData.object);
    }
    static async confirm(event, target) {
        await this.mergeResults(target.name);
    }
    async dialog(...options) {
        return new Promise((resolve) => {
            const dialog = new DialogApp(options);
            dialog.addEventListener("close", () => {
                resolve(null);
            }, { once: true });
            dialog.render({ force: true });
            dialog.promise = async result => {
                resolve(result);
                dialog.close();
            }
        });
    }
    makeButton(label, value) {
        return {type: 'submit', action: 'confirm', label: label, name: value};
    }
    async mergeResults(name) {
        if (name === false) this.promise(false);
        while (this.results === undefined) {
            await new Promise(async (resolve) => {
                setTimeout(resolve, 10);
            })
        }
        this.results.buttons = name;
        this.promise(this.results);
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
    formatInputs() {
        let context = {};
        context.content = this.content;
        context.inputs = [];
        context.buttons = [];
        for (let i of this.inputs) {
            switch (i[0]) {
                case 'button': 
                    i[1].forEach(([label, value]) => context.buttons.push(this.makeButton(label, value)))
                    break;
                case 'checkbox':
                    let checkboxOptions = [];
                    for (let j of i[1]) {
                        checkboxOptions.push({label: j[0], value: j[1], isChecked: j?.[2]?.isChecked ?? false, image: j?.[2]?.image ?? undefined})
                    }
                    context.inputs.push({
                        isCheckbox: true,
                        hasImages: i[2]?.hasImages,
                        options: checkboxOptions
                    })
                    break;
                case 'radio':
                    let radioOptions = [];
                    for (let j of i[1]) {
                        radioOptions.push({label: j[0], value: j[1], isSelected: j?.[2]?.isSelected ?? false, image: j?.[2]?.image ?? undefined})
                    }
                    context.inputs.push({
                        isRadio: true,
                        hasImages: i[2]?.hasImages,
                        options: radioOptions
                    })
                    break;
                case 'select':
                    let selectOptions = [];
                    for (let j of i[1]) {
                        selectOptions.push({label: j[0], value: j[1], maxAmount: j?.[2]?.maxAmount ?? undefined, currentAmount: j?.[2]?.currentAmount ?? undefined, image: j?.[2]?.image ?? undefined})
                    }
                    context.inputs.push({
                        isSelect: true,
                        hasImages: i[2]?.hasImages,
                        options: selectOptions
                    })
                    break;
                case 'text':
                    break;
                case 'number':
                    break;
                case 'fileBrower':
                    break;
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
    async _prepareContext(options) {
        if (!this.context) this.formatInputs();
        let context = this.context;
        console.log(context);
        return context;
    }
    async _onChangeForm(formConfig, event) {
        let targetInput = event.target;
        let currentContext = this.context;
        let targetInputId = JSON.parse(targetInput.id);    
        console.log("Form is changing", formConfig, event);
        console.log(event.target, event.target.name, event.target.checked, event.target.type, event.target.id);
        switch (targetInput.type) {
            case 'checkbox':
                currentContext.inputs[targetInputId[0]].options[targetInputId[1]].isChecked = targetInput.checked;
                break;
        }
        this.context = currentContext;
        this.render(true);
    }
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