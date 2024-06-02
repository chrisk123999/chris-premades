import {DialogApp} from '../../applications/dialog.js';
import { tokenUtils } from './tokenUtils.js';
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
async function selectTargetDialog(title, content, targets, options = {returnUuid: false, type: 'one', selectOptions: [], skipDeadandUnconscious: true, coverToken: undefined, reverseCover: false, displayDistance: true}) {
    let inputs = [
        [options?.type === 'multiple' ? 'checkbox' : options?.type === 'number' ? 'number' : options?.type === 'select' ? 'selectOption' : 'radio']
    ];
    let targetInputs = [];
    let number = 1;
    for (let i of targets) {
        let label;
        if (game.settings.get('chris-premades', 'Show Names')) {
            label = i.document.name;
        } else {
            if (i.document.disposition <= 0) {
                label = 'Unknown Target (' + number + ')';
                number++;
            } else {
                label = i.document.name;
            }
        }
        if (options?.coverToken && !options?.reverseCover) {
            label += ' [' + tokenUtils.chris.checkCover(options.coverToken, i, undefined, true) + ']';
        } else if (options?.coverToken) {
            label += ' [' + tokenUtils.chris.checkCover(i, options.coverToken, undefined, true) + ']';
        }
        if (options?.displayDistance && options?.coverToken) {
            let distance = tokenUtils.chris.getDistance(options.coverToken, i);
            label += ' [' + +distance.toFixed(2) + ' ' + canvas.scene.grid.units + ' ]';
        }
        let image = i.document.texture.src;
        let value = i.id;
        let isDefaultSelected = targetInputs.length === 0;
        targetInputs.push({
            label: label,
            name: value,
            options: {image: image, isChecked: isDefaultSelected}
        });
    }
    inputs[0].push(targetInputs);
    if (options?.skipDeadandUnconscious) {
        inputs.push([
            'checkbox',
            [{
                label: 'CHRISPREMADES.SkipDeadAndUnconscious',
                name: 'skip',
                options: {isChecked: true}
            }]
        ]);
    }
    let selection = await DialogApp.dialog(title, content, inputs, 'okCancel');
    console.log(selection);
    return selection;
}
export let dialogUtils = {
    buttonDialog,
    numberDialog,
    selectTargetDialog
};