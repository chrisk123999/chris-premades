import {DialogApp} from '../../applications/dialog.js';
/*
button, checkbox, radio, select, text, number, filePicker
    --dialog - 203 - buttons, select one
    --numberDialog - external, 1 number input, ok cancel
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
async function buttonDialog(title, content, buttons, options = {displayVertical: true}) {
    let inputs = [
        ['button', [], {displayVertical: options.displayVertical}]
    ];
    for (let [label, value] of buttons) {
        inputs[0][1].push({label: label, name: value});
    }
    let result = await DialogApp.dialog(title, content, inputs, undefined, {width: 400});
    return result.buttons;
}
async function numberDialog(title, content, input = {label: 'Label', name: 'identifier', options: {}}, options) {
    let inputs = [
        ['number', 
            {
                label: input.label,
                name: input.name,
                options: input.options
            }
        ]
    ];
    let result = await DialogApp.dialog(title, content, inputs, 'okCancel', options);
    return result[input.name];
}