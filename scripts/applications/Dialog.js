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
    {'button': [['Label 1', value1], ['Label 2', value2]]},
    {'checkbox': [['Label 1', value1, true], ['Label 2', value2]]},
    {'select': [['Label 1', ]]}

]

await new DialogApp('Title', 'This is a dialog', [{'button': [['Label 1', value1], ['Label 2', value2]]}], 'yesNo').render(true)

buttonDialog(title, content, buttons)
// ('My Dialog', 'This is a dialog', ['Cool', true])
button, checkbox, radio, select, text, number
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
    constructor(title, content, inputs, buttons) {
        super();
        this.windowTitle = title,
        this.content = content,
        this.inputs = inputs,
        this.buttons = buttons
    }
    static DEFAULT_OPTIONS = {
        tag: 'form',
        form: {
            handler: DialogApp.formHandler,
            submitOnChange: true,
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
        console.log(event, form, formData, 'I am a form handler');
    }
    static async confirm(event, target) {
        console.log(event, target)
        this.close();
    }
    get title() {
        return this.windowTitle;
    }
    async _prepareContext(options) {
        let context = {};
        context.content = this.content;
        context.inputs = this.inputs;
        switch (this.buttons) {
            case 'yesNo': context.buttons = this.buttons;
            break;
            case 'okCancel': context.buttons = this.buttons;
            break;
        }
        return {
            'content': this.content, 
            'inputs': [{
                isButton: true, 
                options: [{
                        value: 'yes', 
                        label: "CHRISPREMADES.Yes"
                    }]
                }],
            'buttons': [
                {type: 'submit', label: 'Yes'}
            ]
        };
    }
    async _onChangeForm(formConfig, event) {
        console.log(formConfig, event);
    }
}