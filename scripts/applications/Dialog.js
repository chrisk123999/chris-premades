let { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

/**
 * @param {string} title Dialog Window Title
 * @param {string} content Content placed above the Dialog inputs
 * @param {object} inputs Form parts of the dialog
 * @param {string} buttons Buttons at the bottom of dialog
 * - yesNo, okayCancel 
 *
 * 
 * 
 */
/*
[
    {'button': [['Label 1', value1], ['Label 2', value2]]},
    {'checkbox': [['Label 1', value1, true], ['Label 2', value2]]},

]

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
        this.title = title,
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
        }
    }
    static PARTS = {
        form: {
            template: 'modules/chris-premades/templates/dialogApp.hbs'
        }
    }
    static async formHandler(event, form, formData) {
        console.log(event, form, formData)
    }
    static async confim(event, target) {
        console.log(event, target)
    }
    async _prepareContent(options) {
        console.log(options)
    }
    async _onChangeForm(formConfig, event) {
        console.log(formConfig, event);
    }
}