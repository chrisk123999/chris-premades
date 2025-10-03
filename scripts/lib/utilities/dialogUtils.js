import {DialogApp} from '../../applications/dialog.js';
import {tokenUtils, genericUtils} from '../../utils.js';
import {socket, sockets} from '../sockets.js';
async function buttonDialog(title, content, buttons, {displayAsRows = true, userId = game.user.id} = {}) {
    let inputs = [
        ['button', [], {displayAsRows: displayAsRows}]
    ];
    for (let [label, value, options] of buttons) {
        inputs[0][1].push({label: label, name: value, options: options ?? {}});
    }
    let result;
    if (userId != game.user.id) {
        result = await socket.executeAsUser(sockets.dialog.name, userId, title, content, inputs, undefined, {width: 400});
    } else result = await DialogApp.dialog(title, content, inputs, undefined, {width: 400});
    return result?.buttons ?? false;
}
async function numberDialog(title, content, input = {label: 'Label', name: 'identifier', options: {}}, {buttons = 'okCancel', userId = game.user.id}={}) {
    let inputs = [
        ['number', 
            [{
                label: input.label,
                name: input.name,
                options: input.options
            }]
        ]
    ];
    let result;
    if (userId && userId != game.user.id) {
        result = await socket.executeAsUser(sockets.dialog.name, userId, title, content, inputs, buttons);
    } else result = await DialogApp.dialog(title, content, inputs, buttons);
    return result[input.name];
}
async function selectDialog(title, content, input = {label: 'Label', name: 'identifier', options: {}}, {buttons = 'okCancel', userId = game.user.id}={}) {
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
    let result;
    if (userId && userId != game.user.id) {
        result = await socket.executeAsUser(sockets.dialog.name, userId, title, content, inputs, buttons);
    } else result = await DialogApp.dialog(title, content, inputs, buttons);
    return result?.[input.name];
}
async function selectTargetDialog(title, content, targets, {type = 'one', selectOptions = [], skipDeadAndUnconscious = true, coverToken = undefined, reverseCover = false, displayDistance = true, maxAmount = 1, minAmount = 0, userId = game.user.id, buttons = 'okCancel', maxes = {}} = {}) {
    let inputs = [
        [type === 'multiple' ? 'checkbox' : type === 'number' ? 'number' : type === 'select' ? 'selectOption' : type === 'selectAmount' ? 'selectAmount' : 'radio']
    ];
    let targetInputs = [];
    let number = 1;
    for (let i of targets) {
        let label;
        if (!genericUtils.getCPRSetting('hideNames')) {
            label = i.document.name;
        } else {
            if (i.document.disposition <= 0) {
                label = genericUtils.translate('CHRISPREMADES.UnknownTarget') + ' (' + number + ')';
                number++;
            } else {
                label = i.document.name;
            }
        }
        if (coverToken && !reverseCover) {
            label += ' [' + tokenUtils.checkCover(coverToken, i, {displayName: true}) + ']';
        } else if (coverToken) {
            label += ' [' + tokenUtils.checkCover(i, coverToken, {displayName: true}) + ']';
        }
        if (displayDistance && coverToken) {
            let distance = tokenUtils.getDistance(coverToken, i);
            label += ' [' + distance.toFixed(2) + ' ' + canvas.scene.grid.units + ' ]';
        }
        let image = i.document.texture.src;
        let value = i.id;
        let isDefaultSelected = targetInputs.length === 0;
        targetInputs.push({
            label: label,
            name: value,
            options: {image: image, isChecked: isDefaultSelected, options: selectOptions, maxAmount: maxes[i.id] ?? maxAmount, minAmount}
        });
    }
    inputs[0].push(targetInputs);
    inputs[0].push({displayAsRows: true, radioName: 'targets', totalMax: maxAmount});
    if (skipDeadAndUnconscious) {
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
    if (userId && userId != game.user.id) {
        selection = await socket.executeAsUser(sockets.dialog.name, userId, title, content, inputs, buttons, {width: 500});
    } else selection = await DialogApp.dialog(title, content, inputs, buttons, {width: 500});
    if (selection?.buttons == false || !selection) return false;
    let result;
    let skip = selection?.skip;
    switch (type) {
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
async function confirm(title, content, {userId = game.user.id, buttons = 'yesNo'} = {}) {
    let selection;
    if (userId !== game.user.id) {
        selection = await socket.executeAsUser(sockets.dialog.name, userId, title, content, [], buttons);
    } else selection = await DialogApp.dialog(title, content, [], buttons);
    return selection?.buttons;
}
async function confirmUseItem(item, {userId = game.user.id, buttons = 'yesNo'} = {}) {
    return await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), {userId, buttons});
}
async function selectDocumentDialog(title, content, documents, {displayTooltips = false, sortAlphabetical = false, sortCR = false, userId = game.user.id, addNoneDocument = false, showCR = false, showSpellLevel = false} = {}) {
    if (sortAlphabetical) {
        documents = documents.sort((a, b) => {
            return a.name.localeCompare(b.name, 'en', {'sensitivity': 'base'});
        });
    }
    if (sortCR) {
        documents = documents.sort((a, b) => {
            return a.system?.details?.cr > b.system?.details?.cr ? -1 : 1;
        });
    }
    let isCompendiumDoc = !documents[0]?.id;
    let inputFields = documents.map(i => ({
        label: i.name + (showCR ? ' [' + genericUtils.format('DND5E.CRLabel', {cr: i.system?.details?.cr ?? '?'}) + ']' : (showSpellLevel ? ' [' + genericUtils.translate('DND5E.SpellLevel') + ' ' + (i.system?.level ?? '?') + ']' : '')) + (i.system?.linkedActivity ? ' (' + i.system.linkedActivity.item.name + ')' : ''),
        name: isCompendiumDoc ? (i.uuid ?? i.actor?.uuid) : (i.id ?? i.actor?.id),
        options: {
            image: i.img + (i.system?.details?.cr != undefined ? ` (CR ${genericUtils.decimalToFraction(i.system?.details?.cr)})` : ``),
            tooltip: displayTooltips ? i.system.description.value.replace(/<[^>]*>?/gm, '') : undefined
        }
    }));
    if (addNoneDocument) {
        inputFields.push({
            label: genericUtils.translate('DND5E.None'),
            name: 'none',
            options: {
                image: 'icons/svg/cancel.svg'
            }
        });
    }
    let inputs = [['button', inputFields, {displayAsRows: true}]];
    let result;
    if (userId != game.user.id) {
        result = await socket.executeAsUser(sockets.dialog.name, userId, title, content, inputs, undefined);
    } else {
        result = await DialogApp.dialog(title, content, inputs, undefined);
    }
    if (result?.buttons) return isCompendiumDoc ? fromUuid(result.buttons) : documents.find(i => i.id === result.buttons);
    return false;
}
async function selectDocumentsDialog(title, content, documents, {max = undefined, displayTooltips = false, sortAlphabetical = false, sortCR = false, userId = game.user.id, showCR = false, checkbox = false, weights = {}, maxes = {}} = {}) {
    if (sortAlphabetical) {
        documents = documents.sort((a, b) => {
            return a.name.localeCompare(b.name, 'en', {'sensitivity': 'base'});
        });
    }
    if (sortCR) {
        documents = documents.sort((a, b) => {
            return a.system?.details?.cr > b.system?.details?.cr ? -1 : 1;
        });
    }
    let inputFields = documents.map(i => ({
        label: i.name + (showCR ? ' [' + genericUtils.format('DND5E.CRLabel', {cr: i.system?.details?.cr ?? '?'}) + ']' : ''),
        name: i.id ?? i._id,
        options: {
            image: i.img + (i.system?.details?.cr != undefined ? ` (CR ${genericUtils.decimalToFraction(i.system?.details?.cr)})` : ``),
            tooltip: displayTooltips ? i.system.description.value.replace(/<[^>]*>?/gm, '') : undefined,
            minAmount: 0,
            maxAmount: maxes?.[i.id] ?? max,
            weight: weights?.[i.id] ?? 1
        }
    }));
    let inputs = [[checkbox ? 'checkbox' : 'selectAmount', inputFields, {displayAsRows: true, totalMax: max}]];
    let result;
    if (game.user.id != userId) {
        result = await socket.executeAsUser(sockets.dialog.name, userId, title, content, inputs, undefined, {height: 'auto'});
    } else {
        result = await DialogApp.dialog(title, content, inputs, 'okCancel', {height: 'auto'});
    }
    if (result?.buttons) {
        delete result.buttons;
        return Object.entries(result).map(([key, value]) => ({document: documents.find(i => (i.id ?? i._id) === key), amount: Number(value)}));
    } else {
        return false;
    }
}
async function selectHitDie(actor, title, content, {max = 1, userId = game.user.id} = {}) {
    let documents = actor.items.filter(i => i.type === 'class' && (i.system.levels - i.system.hd.spent) > 0);
    if (!documents.length) return;
    documents = documents.sort((a, b) => {
        return a.name.localeCompare(b.name, 'en', {'sensitivity': 'base'});
    });
    let inputFields = documents.map(i => ({
        label: genericUtils.format('CHRISPREMADES.Dialog.HitDieLabel', {className: i.name, remaining: i.system.levels - i.system.hd.spent, max: i.system.levels, denomination: i.system.hd.denomination}),
        name: i.id,
        options: {
            image: i.img,
            minAmount: 0,
            maxAmount: Math.min(i.system.levels - i.system.hd.spent, max)
        }
    }));
    let inputs = [[max == 1 ? 'checkbox' : 'selectAmount', inputFields, {displayAsRows: true, totalMax: max}]];
    let result;
    if (game.user.id != userId) {
        result = await socket.executeAsUser(sockets.dialog.name, userId, title, content, inputs, 'okCancel', {height: 'auto'});
    } else {
        result = await DialogApp.dialog(title, content, inputs, 'okCancel', {height: 'auto'});
    }
    if (result?.buttons) {
        delete result.buttons;
        return Object.entries(result).map(([key, value]) => ({document: documents.find(i => i.id === key), amount: Number(value)}));
    } else {
        return false;
    }
}
async function selectSpellSlot(actor, title, content, {maxLevel = 9, minLevel = 0, userId = game.user.id, no = false} = {}) {
    let inputs = Object.entries(actor.system.spells).filter(i => {
        if (i[1].level > maxLevel) return;
        if (i[1].level < minLevel) return;
        if (i[0] === 'spell0') return;
        if (i[1].value > 0 && i[1].max > 0) return true;
    }).map(j => {
        if (j[0] === 'pact') {
            return [CONFIG.DND5E.spellPreparationModes.pact.label + ' (' + j[1].level + ')', 'pact'];
        } else {
            return [CONFIG.DND5E.spellLevels[j[1].level], j[1].level];
        }
    });
    if (no) inputs.push(['CHRISPREMADES.Generic.No', false]);
    return await buttonDialog(title, content, inputs, {displayAsRows: true, userId: userId});
}
async function selectDamageType(damageTypes, title, context, {addNo = false} = {}) {
    let images = {
        acid: 'icons/magic/acid/projectile-faceted-glob.webp',
        bludgeoning: 'icons/magic/earth/projectiles-stone-salvo-gray.webp',
        cold: 'icons/magic/air/wind-tornado-wall-blue.webp',
        fire: 'icons/magic/fire/beam-jet-stream-embers.webp',
        force: 'icons/magic/sonic/projectile-sound-rings-wave.webp',
        lightning: 'icons/magic/lightning/bolt-blue.webp',
        necrotic: 'icons/magic/unholy/projectile-bolts-salvo-pink.webp',
        piercing: 'icons/skills/melee/strike-polearm-light-orange.webp',
        poison: 'icons/magic/death/skull-poison-green.webp',
        psychic: 'icons/magic/control/fear-fright-monster-grin-red-orange.webp',
        radiant: 'icons/magic/holy/projectiles-blades-salvo-yellow.webp',
        slashing: 'icons/skills/melee/strike-sword-gray.webp',
        thunder: 'icons/magic/sonic/explosion-shock-wave-teal.webp',
        no: 'icons/svg/cancel.svg'
    };
    let buttons = damageTypes.map(i => {
        let image = images[i] ?? 'icons/magic/symbols/question-stone-yellow.webp';
        return [
            CONFIG.DND5E.damageTypes[i].label,
            i,
            {image}
        ];
    });
    if (addNo) buttons.push(['CHRISPREMADES.Generic.No', false, {image: images.no}]);
    return await buttonDialog(title, context, buttons);
}
async function queuedConfirmDialog(title, content, {actor, reason, userId} = {}) {
    let selection;
    if (userId !== game.user.id) {
        selection = await socket.executeAsUser(sockets.queuedDialog.name, userId, [title, content], {actorUuid: actor.uuid, reason});
    } else {
        selection = await sockets.queuedDialog([title, content], {actorUuid: actor.uuid, reason});
    }
    return selection;
}
export let dialogUtils = {
    buttonDialog,
    numberDialog,
    selectDialog,
    selectTargetDialog,
    selectDocumentDialog,
    selectDocumentsDialog,
    confirm,
    selectHitDie,
    selectSpellSlot,
    selectDamageType,
    queuedConfirmDialog,
    confirmUseItem
};