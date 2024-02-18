import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
async function carefulSpell({speaker, actor, token, character, item, args, scope, workflow}){
    if (workflow.targets.size === 0 ||  workflow.item.type != 'spell' || !workflow.hasSave) return;
    let effect = chris.findEffect(workflow.actor, 'Sorcery Points');
    if (!effect) {
        ui.notifications.info('Sorcery Points Item Effect Not Found!');
        return;
    }
    let sorcPointsItem = await fromUuid(effect.origin);
    if (!sorcPointsItem) return;
    let sorcPointsValue = sorcPointsItem.system.uses.value;
    if (sorcPointsValue < 1) return;
    if (!sorcPointsValue) {
        ui.notifications.info('No Sorcery Points Available!');
        return;
    }
    let max = workflow.actor.system.abilities.cha.mod;
    if (!max) return;
    let targets = Array.from(workflow.targets);
    let selectedTargets = [];
    for (let i of targets) {
        if (i.document.disposition === workflow.token.document.disposition) selectedTargets.push(i);
    }
    if (selectedTargets.length > max) {
        let selection = await chris.selectTarget('What targets automatically save? (Max ' + max + ')', constants.okCancel, selectedTargets, true, 'multiple');
        if (!selection.buttons) return;
        selectedTargets = [];
        for (let i of selection.inputs) {
            if (i) selectedTargets.push(await fromUuid(i));
        }
        if (selectedTargets.length > max) {
            ui.notifications.info('Too many targets selected!');
            return;
        }
    }
    let effectData = {
        'label': 'Careful Spell Auto Save',
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'duration': {
            'seconds': 6
        },
        'changes': [
            {
                'key': 'flags.midi-qol.min.ability.save.all',
                'mode': 5,
                'value': '100',
                'priority': 120
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    'isSave'
                ]
            }
        }
    }
    selectedTargets.forEach(async i => await chris.createEffect(i.actor, effectData))
    await sorcPointsItem.update({'system.uses.value': sorcPointsValue - 1});
}
async function empoweredSpell({speaker, actor, token, character, item, args, scope, workflow}){
    if (workflow.hitTargets.size === 0 ||  workflow.item.type != 'spell') return;
    let effect = chris.findEffect(workflow.actor, 'Sorcery Points');
    if (!effect) {
        ui.notifications.info('Sorcery Points Item Effect Not Found!');
        return;
    }
    let sorcPointsItem = await fromUuid(effect.origin);
    if (!sorcPointsItem) return;
    let sorcPointsValue = sorcPointsItem.system.uses.value;
    if (!sorcPointsValue) return;
    let max = workflow.actor.system.abilities.cha.mod;
    let queueSetup = await queue.setup(workflow.item.uuid, 'empoweredSpell', 350);
    if (!queueSetup) return;
    let newDamageRoll = workflow.damageRoll;
    let lowest = [];
    for (let i = 0; newDamageRoll.terms.length > i; i++) {
        if (newDamageRoll.terms[i].isDeterministic === false) {
            let currentTerm = newDamageRoll.terms[i];
            let faces = currentTerm.faces;
            for (let j = 0; currentTerm.values.length > j; j++) {
                let modifiers = currentTerm.modifiers?.toString();
                if (lowest.length === 0) {
                    lowest.push({
                        'result': currentTerm.values[j],
                        'position': j,
                        'faces': faces,
                        'term': i,
                        'modifiers': modifiers,
                        'flavor': currentTerm.flavor
                    });
                }
                else if (lowest.length > 0) {
                    for (let k = 0; lowest.length > k; k++) {
                        if (currentTerm.values[j] <= lowest[k].result) {
                            lowest.splice(k, 0, {
                                'result': currentTerm.values[j],
                                'position': j,
                                'faces': faces,
                                'term': i,
                                'modifiers': modifiers,
                                'flavor': currentTerm.flavor
                            });
                            if (lowest.length > max) {
                                lowest.splice(max, 1);
                            }
                            break;
                        }
                        if (currentTerm.values[j] > lowest[lowest.length - 1].result && lowest.length != max) {
                            lowest.push({
                                'result': currentTerm.values[j],
                                'position': j,
                                'faces': faces,
                                'term': i,
                                'modifiers': modifiers,
                                'flavor': currentTerm.flavor
                            });
                            break;
                        }
                    }
                }
            }
        }
    }
    function dialogRender(html) {
        let ths = html[0].getElementsByTagName('th');
        for (let t of ths) {
            t.style.width = 'auto';
            t.style.textAlign = 'left';
        }
        let tds = html[0].getElementsByTagName('td');
        for (let t of tds) {
            t.style.width = '200px';
            t.style.textAlign = 'right';
            t.style.paddingRight = '5px';
        }
    }
    let generatedMenu = [];
    for (let i of lowest) {
        generatedMenu.push({
            'label': '1d' + i.faces + '[' + i.flavor + ']: ' + i.result,
            'type': 'checkbox',
            'options': false
        });
    }
    let config = {
        'title': 'Empowered Spell: Reroll lowest dice?',
        'render': dialogRender
    };
    let selection = await warpgate.menu(
        {
            'inputs': generatedMenu,
            'buttons': constants.yesNoButton
        },
        config
    );
    if (!selection.buttons) {
        queue.remove(workflow.item.uuid);
        return;
    }
    if (selection.inputs.filter(i => i != false).length === 0) {
        queue.remove(workflow.item.uuid);
        return;
    }
    for (let i = 0; lowest.length > i; i++) {
        if (!selection.inputs[i]) continue;
        let currentDie = lowest[i];
        let damageFormula = '1d' + currentDie.faces + currentDie.modifiers;
        let damageRoll = await chris.damageRoll(damageFormula);
        let messageData = {
            'speaker': ChatMessage.getSpeaker(workflow.actor), 
            'flavor': 'Rerolling: ' + currentDie.result, 
            'rollMode': game.settings.get('core', 'rollMode')
        }
        await damageRoll.toMessage(messageData);
        newDamageRoll.terms[currentDie.term].results[currentDie.position].result = damageRoll.total;
    }
    newDamageRoll._total = newDamageRoll._evaluateTotal();
    await workflow.setDamageRoll(newDamageRoll);
    await sorcPointsItem.update({'system.uses.value': sorcPointsValue - 1});
    queue.remove(workflow.item.uuid);
}
async function heightenedSpell({speaker, actor, token, character, item, args, scope, workflow}){
    if (workflow.targets.size === 0 ||  workflow.item.type != 'spell' || !workflow.hasSave) return;
    let effect = chris.findEffect(workflow.actor, 'Sorcery Points');
    if (!effect) {
        ui.notifications.info('Sorcery Points Item Effect Not Found!');
        return;
    }
    let sorcPointsItem = await fromUuid(effect.origin);
    if (!sorcPointsItem) return;
    let sorcPointsValue = sorcPointsItem.system?.uses?.value;
    if (sorcPointsValue < 3) {
        ui.notifications.info('No Sorcery Points Available!');
        return;
    }
    let max = workflow.actor.system.abilities.cha.mod;
    let selectedTargets = Array.from(workflow.targets);
    if (selectedTargets.length > max) {
        let selection = await chris.selectTarget('Give what targets disadvantage? (Max ' + max + ')', constants.okCancel, selectedTargets, true, 'multiple');
        if (!selection.buttons) return;
        selectedTargets = [];
        for (let i of selection.inputs) {
            if (i) selectedTargets.push(await fromUuid(i));
        }
        if (selectedTargets.length > max) {
            ui.notifications.info('Too many targets selected!');
            return;
        }
    }
    let effectData = {
        'label': 'Heightened Spell Disadvantage',
        'icon': 'icons/magic/time/arrows-circling-green.webp',
        'duration': {
            'seconds': 6
        },
        'changes': [
            {
                'key': 'flags.midi-qol.disadvantage.ability.save.all',
                'mode': 5,
                'value': '1',
                'priority': 120
            }
        ],
        'flags': {
            'dae': {
                'specialDuration': [
                    'isSave'
                ]
            }
        }
    }
    selectedTargets.forEach(async i => await chris.createEffect(i.actor, effectData))
    await sorcPointsItem.update({'system.uses.value': sorcPointsValue - 3});
}
async function seekingSpell({speaker, actor, token, character, item, args, scope, workflow}){
    if (workflow.item.flags['chris-premades']?.seekingSpell) {
        let queueSetup = await queue.setup(workflow.item.uuid, 'seekingSpell', 340);
        if (!queueSetup) return;
        await workflow.setDamageRoll(workflow.item.flags['chris-premades'].seekingSpell);
        queue.remove(workflow.item.uuid);
    }
    if (workflow.targets.size === 0 || workflow.targets.size === workflow.hitTargets.size || workflow.item.flags['chris-premades']?.seekingSpell || workflow.item.type != 'spell') return;
    let effect = chris.findEffect(workflow.actor, 'Sorcery Points');
    if (!effect) {
        ui.notifications.info('Sorcery Points Item Effect Not Found!');
        return;
    }
    let sorcPointsItem = await fromUuid(effect.origin);
    if (!sorcPointsItem) return;
    let sorcPointsValue = sorcPointsItem.system?.uses?.value;
    if (sorcPointsValue < 2) {
        ui.notifications.info('No Sorcery Points Available!');
        return;
    }
    let queueSetup = await queue.setup(workflow.item.uuid, 'seekingSpell', 360);
    if (!queueSetup) return;
    let selection = await chris.dialog('Use Seeking Spell to reroll miss of ' + workflow.attackTotal + '?', [['Yes', true], ['No', false]]);
    if (!selection) return;
    let spellLevel = workflow.castData?.castLevel;
    if (spellLevel === undefined) return;
    let targetToken = workflow.targets.first();
    let targetTokenUuid = targetToken.document.uuid;
    if (!targetTokenUuid) return;
    let damageRoll = workflow.damageRoll;
    if (!damageRoll) return;
    let spellData = duplicate(workflow.item.toObject());
    let [config, options] = constants.syntheticItemWorkflowOptions([targetTokenUuid], false, spellLevel);
    if (!options) return;
    setProperty(spellData, 'flags.chris-premades.metaMagic', true);
    setProperty(spellData, 'flags.chris-premades.seekingSpell', damageRoll);
    spellData.name = workflow.item.name + ' Re-Roll';
    let spell = new CONFIG.Item.documentClass(spellData, {'parent': workflow.actor});
    await MidiQOL.completeItemUse(spell, config, options);
    let damageFormula = ('0');
    let newDamageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(newDamageRoll);
    await sorcPointsItem.update({'system.uses.value': sorcPointsValue - 1});
    queue.remove(workflow.item.uuid);
}
async function transmutedSpell({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size === 0) return;
    if (workflow.item.type != 'spell') return;
    let effect = chris.findEffect(workflow.actor, 'Sorcery Points');
    if (!effect) {
        ui.notifications.info('Sorcery Points Item Effect Not Found!');
        return;
    }
    let sorcPointsItem = await fromUuid(effect.origin);
    if (!sorcPointsItem) return;
    let sorcPointsValue = sorcPointsItem.system?.uses?.value;
    if (!sorcPointsValue) {
        ui.notifications.info('No Sorcery Points Available!');
        return;
    }
    let values = ['acid', 'cold', 'fire', 'lightning', 'poison', 'thunder'];
    let oldDamageRoll = workflow.damageRoll;
    let oldFlavor = [];
    for (let i of oldDamageRoll.terms) {
        let isDeterministic = i.isDeterministic;
        if (values.includes(i.flavor.toLowerCase()) && isDeterministic === false) {
            oldFlavor.push(i.flavor);
        }
    }
    function valuesToOptions(arr){
        let optionsPush = [];
        for (let i = 0; arr.length > i; i++) {
            if (typeof arr[i] != 'string') return;
            optionsPush.push([arr[i].charAt(0).toUpperCase() + arr[i].slice(1), arr[i]]);
        }
        return optionsPush;
    }
    let optionsOriginal = valuesToOptions(oldFlavor);
    let selectionOriginal = await chris.dialog('Change what damage type?', optionsOriginal);
    if (!selectionOriginal) return;
    let options = []
    for (let i of values) {
        if (i != selectionOriginal) {
            options.push(i);
        }
    }
    options = valuesToOptions(options);
    let selection = await chris.dialog('Change to what damage type?', options)
    let queueSetup = await queue.setup(workflow.item.uuid, 'transmutedSpell', 50);
    if (!queueSetup) return;
    workflow.damageRoll._formula = workflow.damageRoll._formula.replace(selectionOriginal, selection);
    workflow.damageRoll.terms.forEach(term => term.options.flavor = term.options?.flavor?.replace(selectionOriginal, selection))
    await workflow.setDamageRoll(workflow.damageRoll);
    await sorcPointsItem.update({'system.uses.value': sorcPointsValue - 1});
    queue.remove(workflow.item.uuid);
}
async function twinnedSpell({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    if (workflow.item.type != 'spell' || workflow.item.system.range.units === 'self' || workflow.item.flags['chris-premades']?.metaMagic) return;
    let spellLevel = workflow.castData.castLevel;
    if (spellLevel === undefined) return;
    let effect = chris.findEffect(workflow.actor, 'Sorcery Points');
    if (!effect) {
        ui.notifications.info('Sorcery Points Item Effect Not Found!');
        return;
    }
    let sorcPointsItem = await fromUuid(effect.origin);
    if (!sorcPointsItem) return;
    let sorcPointsValue = sorcPointsItem.system.uses.value;
    if (!sorcPointsValue) {
        ui.notifications.info('No Sorcery Points Available!');
        return;
    }
    if (sorcPointsValue < spellLevel) return;
    let itemRange = workflow.item.system?.range?.value;
    if (!itemRange) {
        if (workflow.item.system.range.units === 'touch') {
            itemRange = 5;
        } else {
            return;
        }
    }
    let actionType = workflow.item.system.actionType;
    if (!actionType) return;
    let disposition;
    switch (actionType) {
        case 'rsak':
        case 'msak':
        case 'savingThrow':
            disposition = 'enemy';
            break;
        case 'heal':
            disposition = 'ally';
            break;
        case 'utility':
        case 'other':
            disposition = null;
            break;
    }
    let queueSetup = await queue.setup(workflow.item.uuid, 'twinnedSpell', 450);
    if (!queueSetup) return;
    let nearbyTargets = chris.findNearby(workflow.token, itemRange, disposition, false, true).filter(t => t.id != workflow.targets.first().id);
    if (nearbyTargets.length === 0) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let selected = await chris.selectTarget('Use Twinned Spell?', constants.yesNoButton, nearbyTargets, true, 'one');
    if (!selected.buttons) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let targetTokenUuid = selected.inputs.find(id => id);
    if (!targetTokenUuid) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let spellData = duplicate(workflow.item.toObject());
    let [config, options] = constants.syntheticItemWorkflowOptions([targetTokenUuid], false, spellLevel);
    setProperty(spellData, 'flags.chris-premades.metaMagic', true);
    spellData.system.components.concentration = false;
    let spell = new CONFIG.Item.documentClass(spellData, {'parent': workflow.actor});
    spell.prepareData();
    spell.prepareFinalAttributes();
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(spell, config, options);
    if (spellLevel === 0) spellLevel = 1;
    await sorcPointsItem.update({'system.uses.value': sorcPointsValue - spellLevel});
    if (workflow.item.system.components.concentration) {
        let concentrationsTargets = workflow.actor?.flags['midi-qol']['concentration-data']?.targets;
        concentrationsTargets.splice(0, 0, {'tokenUuid': targetTokenUuid, 'actorUuid': targetTokenUuid});
        await workflow.actor.setFlag('midi-qol', 'concentration-data.targets', concentrationsTargets);
    }
    queue.remove(workflow.item.uuid);
}
export let metaMagic = {
    carefulSpell: carefulSpell,
    empoweredSpell: empoweredSpell,
    heightenedSpell: heightenedSpell,
    seekingSpell: seekingSpell,
    transmutedSpell: transmutedSpell,
    twinnedSpell: twinnedSpell
}