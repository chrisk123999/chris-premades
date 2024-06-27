import {DialogApp} from '../../applications/dialog.js';
import {tokenUtils, genericUtils} from '../../utils.js';
import {socket} from '../sockets.js';
/*
        useSpellWhenEmpty - 1
*/
async function buttonDialog(title, content, buttons, options = {displayAsRows: true, userId: game.user.id}) {
    let inputs = [
        ['button', [], {displayAsRows: options.displayAsRows}]
    ];
    for (let [label, value] of buttons) {
        inputs[0][1].push({label: label, name: value});
    }
    let result;
    if (options.userId != game.user.id) {
        result = await socket.executeAsUser('dialog', options.userId, title, content, inputs, undefined, {width: 400});
    } else result = await DialogApp.dialog(title, content, inputs, undefined, {width: 400});
    return result?.buttons ?? false;
}
async function numberDialog(title, content, input = {label: 'Label', name: 'identifier', options: {}}, options) {
    let inputs = [
        ['number', 
            [{
                label: input.label,
                name: input.name,
                options: input.options
            }]
        ]
    ];
    let result = await DialogApp.dialog(title, content, inputs, 'okCancel', options);
    return result[input.name];
}
async function selectDialog(title, content, input = {label: 'Label', name: 'identifier', options: {}}, options) {
    if (!input.options) input.options = {};
    let inputOptions = input.options.options ?? [];
    if (!inputOptions.length) inputOptions = ['None'];
    if (inputOptions[0].label === undefined) {
        inputOptions = inputOptions.map(text => {return {value: text, label: text};});
    }
    input.options.options = inputOptions;
    let inputs = [
        ['selectOption',
            [{
                label: input.label,
                name: input.name,
                options: input.options
            }]
        ]
    ];
    let result = await DialogApp.dialog(title, content, inputs, 'okCancel', options);
    return result[input.name];
}
async function selectTargetDialog(title, content, targets, options = {returnUuid: false, type: 'one', selectOptions: [], skipDeadAndUnconscious: true, coverToken: undefined, reverseCover: false, displayDistance: true, maxAmount: 1, userId: game.user.id}) {
    let inputs = [
        [options?.type === 'multiple' ? 'checkbox' : options?.type === 'number' ? 'number' : options?.type === 'select' ? 'selectOption' : options?.type === 'selectAmount' ? 'selectAmount' : 'radio']
    ];
    let targetInputs = [];
    let number = 1;
    for (let i of targets) {
        let label;
        if (!genericUtils.getCPRSetting('hideNames')) {
            label = i.document.name;
        } else {
            if (i.document.disposition <= 0) {
                label = 'CHRISPREMADES.UnknownTarget (' + number + ')';
                number++;
            } else {
                label = i.document.name;
            }
        }
        if (options?.coverToken && !options?.reverseCover) {
            label += ' [' + tokenUtils.checkCover(options.coverToken, i, {displayName: true}) + ']';
        } else if (options?.coverToken) {
            label += ' [' + tokenUtils.checkCover(i, options.coverToken, {displayName: true}) + ']';
        }
        if (options?.displayDistance && options?.coverToken) {
            let distance = tokenUtils.getDistance(options.coverToken, i);
            label += ' [' + +distance.toFixed(2) + ' ' + canvas.scene.grid.units + ' ]';
        }
        let image = i.document.texture.src;
        let value = i.id;
        let isDefaultSelected = targetInputs.length === 0;
        targetInputs.push({
            label: label,
            name: value,
            options: {image: image, isChecked: isDefaultSelected, options: options?.selectOptions, maxAmount: options?.maxAmount}
        });
    }
    inputs[0].push(targetInputs);
    inputs[0].push({displayAsRows: true, radioName: 'targets', totalMax: options?.maxAmount});
    if (options?.skipDeadAndUnconscious) {
        inputs.push([
            'checkbox',
            [{
                label: 'CHRISPREMADES.SkipDeadAndUnconscious',
                name: 'skip',
                options: {isChecked: true}
            }]
        ]);
    }
    let selection;
    if (options?.userId && options?.userId != game.user.id) {
        selection = await socket.executeAsUser('dialog', options.userId, title, content, inputs, 'okCancel');
    } else selection = await DialogApp.dialog(title, content, inputs, 'okCancel');
    if (selection?.buttons == false || !selection) return false;
    let result;
    let skip = selection?.skip;
    switch (options?.type) {
        case 'multiple': {
            for (let [key, value] of Object.entries(selection)) {
                if (key === 'buttons' || value === false) continue;
                let doc = targets.find(target => target.id === key);
                if (!doc) continue;
                if (!Array.isArray(result)) result = [];
                result.push(doc);
            }
            break;
        }
        case 'number': {
            for (let [key, value] of Object.entries(selection)) {
                if (key === 'buttons' || value === 0) continue;
                let doc = targets.find(target => target.id === key);
                if (!doc) continue;
                if (!Array.isArray(result)) result = [];
                result.push({document: doc, value: value});
            }
            break;
        }
        case 'selectAmount':
        case 'select': {
            for (let [key, value] of Object.entries(selection)) {
                if (key === 'buttons' || !value || value === '0') continue;
                let doc = targets.find(target => target.id === key);
                if (!doc) continue;
                if (!Array.isArray(result)) result = [];
                result.push({document: doc, value: value});
            }
            break;
        }
        default: {
            result = targets.find(target => target.id === selection.targets);
        }
    }
    return ([result, skip]);
}
async function confirm(title, content, options = {userId: game.user.id}) {
    let selection;
    if (options.userId != game.user.id) {
        selection = await socket.executeAsUser('dialog', options.userId, title, content, [], 'yesNo');
    } else selection = await DialogApp.dialog(title, content, [], 'yesNo');
    return selection.buttons;
}
async function selectDocumentDialog(title, content, documents, options = {displayTooltips: false, sortAlphabetical: false, sortCR: false, userId: game.user.id}) {
    if (options?.sortAlphabetical) {
        documents = documents.sort((a, b) => {
            return a.name.localeCompare(b.name, 'en', {'sensitivity': 'base'});
        });
    }
    if (options?.sortCR) {
        documents = documents.sort((a, b) => {
            return a.system?.details?.cr > b.system?.details?.cr ? -1 : 1;
        });
    }
    let inputs = [
        ['button', [], {displayAsRows: true}]
    ];
    for (let i of documents) {
        inputs[0][1].push({
            label: i.name + (i.system?.details?.cr != undefined ? ` (CR ${genericUtils.decimalToFraction(i.system?.details?.cr)})` : ``),
            name: i.uuid ?? i.actor.uuid,
            options: {
                image: i.img ?? i.icon,
                tooltip: options?.displayTooltips ? i.system.description.value.replace(/<[^>]*>?/gm, '') : undefined
            }
        });
    }
    let result;
    if (options.userId != game.user.id) {
        result = await socket.executeAsUser('dialog', options.userId, title, content, inputs, undefined);
    } else result = await DialogApp.dialog(title, content, inputs, undefined);
    result = result.buttons;
    if (result) return await fromUuid(result);
    else return result;
}
async function selectDocumentsDialog(title, content, documents, options = {max: 5, useUuids: false, displayTooltips: false, sortAlphabetical: false, sortCR: false}) {
    if (options?.sortAlphabetical) {
        documents = documents.sort((a, b) => {
            return a.name.localeCompare(b.name, 'en', {'sensitivity': 'base'});
        });
    }
    if (options?.sortCR) {
        documents = documents.sort((a, b) => {
            return a.system?.details?.cr > b.system?.details?.cr ? -1 : 1;
        });
    }
    let inputs = [
        ['selectAmount', [], {displayAsRows: true, totalMax: options?.max}]
    ];
    for (let i of documents) {
        inputs[0][1].push({
            label: i.name,
            name: options?.useUuids ? i.actor.uuid : i,
            options: {
                image: i.image + (i.system?.details?.cr != undefined ? ` (CR ${genericUtils.decimalToFraction(i.system?.details?.cr)})` : ``),
                tooltip: options?.displayTooltips ? i.system.description.value.replace(/<[^>]*>?/gm, '') : undefined,
                minAmount: 0,
                maxAmount: options?.max ?? 5
            }
        });
    }
    let height = (inputs[0][1].length * 56 + 46);
    if (inputs[0][1].length > 14 ) height = 850;
    let result = await DialogApp.dialog(title, content, inputs, 'undefined', {height: height});
    return result.buttons;
}
async function selectHitDie(actor, title, content, {type = 'selectAmount', userId = game.user.id} = {}) {
    let classes = actor.items.filter(i => i.type === 'class');
    if (!classes.length) return;
    //wrap document selector
}
export let dialogUtils = {
    buttonDialog,
    numberDialog,
    selectDialog,
    selectTargetDialog,
    selectDocumentDialog,
    selectDocumentsDialog,
    confirm,
    selectHitDie
};