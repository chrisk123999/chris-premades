import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../queue.js';
/*
Heightened Spell - Give one target disadvantage for first save, either prompt or just apply effect
**Empowered Spell** - Reroll up to cha mod dice, must use new rolls, doing to have to give dialog with all dice, something like piercer
Seeking Spell - On miss, can reroll the d20 and use the new roll
Transmuted spell - change from acid cold fire poison thunder to acid cold fire lightning poison thunder, just replacing damage die after dialog
Careful spell - allow up to cha mod creatures to auto save on next spell you cast
Twinned spell - points equal to spells level to target another creature (use find creature) with single target only spell
*/
async function carefulSpell({speaker, actor, token, character, item, args, scope, workflow}){
    if (workflow.targets.size === 0 ||  workflow.item.type != 'spell' || !workflow.hasSave) return;
    let sorcPointsItem = workflow.actor.items.getName('Sorcery Points');
    if (!sorcPointsItem) return;
    let sorcPointsValue = sorcPointsItem.system?.uses?.value;
    if (sorcPointsValue < 1) {
        ui.notifications.warn('No Sorcery Points Available!');
        return;
    }
    let max = workflow.actor.system.abilities?.cha?.mod;
    if (!max) return;
    let targets = Array.from(workflow.targets);
    let selectedTargets = [];
    for (let i of targets) {
        if (i.document.disposition === workflow.token.document.disposition) selectedTargets.push(i);
    }
    let buttons = [
        {
            'label': 'OK',
            'value': true
        }, {
            'label': 'Cancel',
            'value': false
        }
    ];
    if (selectedTargets.length > max) {
        let selection = await chris.selectTarget('What targets automatically save? (Max ' + max + ')', buttons, selectedTargets, true, 'multiple');
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
                'value': '999', //Not sure on this value, though i think the opposite is what the force fail save looks like after rolled? But at least 100 should be safe
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
    for (let i = 0; selectedTargets.length > i; i++) {
        await chris.createEffect(selectedTargets[i].actor, effectData);
    }
    await sorcPointsItem.update({'system.uses.value': sorcPointsValue - 1});
}
//Over here vvv
async function empoweredSpell({speaker, actor, token, character, item, args, scope, workflow}){
    if (workflow.hitTargets.size === 0 ||  workflow.item.type != 'spell') return;
    let sorcPointsItem = workflow.actor.items.getName('Sorcery Points');
    if (!sorcPointsItem) return;
    let sorcPointsValue = sorcPointsItem.system?.uses?.value;
    if (!sorcPointsValue) {
        ui.notifications.warn('No Sorcery Points Available!');
        return;
    }
    let max = workflow.actor.system.abilities?.cha?.mod;
    if (!max) return;
    let newDamageRoll = workflow.damageRoll;
    console.log(newDamageRoll);
    let lowest = [];
    let queueSetup = await queue.setup(workflow.item.uuid, 'empoweredSpell', 350);
    if (!queueSetup) return;
    for (let i = 0; newDamageRoll.terms.length > i; i++) {
        if (newDamageRoll.terms[i].isDeterministic === false) {
            let currentTerm = newDamageRoll.terms[i];
            let faces = currentTerm.faces;
            for (let j = 0; currentTerm.values.length > j; j++) {
                let modifiers = currentTerm.modifiers?.toString();
                if (lowest.length === 0) {
                    lowest.push({result: currentTerm.values[j], position: j, faces: faces, term: i, modifiers: modifiers})
                }
                else if (lowest.length > 0) {
                    for (let k = 0; lowest.length > k; k++) {
                        if (currentTerm.values[j] <= lowest[k].result) {
                            lowest.splice(k, 0, {result: currentTerm.values[j], position: j, faces: faces, term: i, modifiers: modifiers})
                            if (lowest.length > max) {
                                lowest.splice(max, 1);
                            }
                            break;
                        }
                        if (currentTerm.values[j] > lowest[lowest.length - 1].result && lowest.length != max) {
                            lowest.push({result: currentTerm.values[j], position: j, faces: faces, term: i, modifiers: modifiers})
                            break;
                        }
                    }
                }
            }
        }
    }
    console.log(lowest);
    /*
    selection = etc

    [lowest] is an array of objects {result, position, faces, term, modifiers}
    should either be 'reroll how many die?, lowest[i].result... ' or 'reroll how many die?, lowest[i].result + '(d' + faces + ')'' ex '3(d8)'
    (max) is the max amount that can be chosen, [lowest] is the lowest from the damage roll to (max) die
    i just need the positions of the selected ones in the lowest array
    dice in the selection should be in order from the array, and just return the selections positions in the array.
    */
    let selection = [0, 1, 2]; //for testing
    for (let i = 0; selection.length > i; i++) {
        let currentDie = lowest[selection[i]];
        let damageFormula = '1d' + currentDie.faces + currentDie.modifiers;
        let damageRoll = await new Roll(damageFormula).roll({async: true});
        let messageData = {
            speaker: ChatMessage.getSpeaker(workflow.actor), 
            flavor: 'Re-Rolling Die Result of ' + currentDie.result, 
            rollMode: game.settings.get("core", "rollMode")
        }
        await damageRoll.toMessage(messageData);
        newDamageRoll.terms[currentDie.term].results[currentDie.position].result = damageRoll.total;
    }
    newDamageRoll._total = newDamageRoll._evaluateTotal();
    console.log(newDamageRoll.total);
    await workflow.setDamageRoll(newDamageRoll);
    await sorcPointsItem.update({'system.uses.value': sorcPointsValue - 1});
    queue.remove(workflow.item.uuid);

}
async function heightenedSpell({speaker, actor, token, character, item, args, scope, workflow}){
    if (workflow.targets.size === 0 ||  workflow.item.type != 'spell' || !workflow.hasSave) return;
    let sorcPointsItem = workflow.actor.items.getName('Sorcery Points');
    if (!sorcPointsItem) return;
    let sorcPointsValue = sorcPointsItem.system?.uses?.value;
    if (sorcPointsValue < 3) {
        ui.notifications.warn('No Sorcery Points Available!');
        return;
    }
    let max = workflow.actor.system.abilities.cha.mod;
    let selectedTargets = Array.from(workflow.targets);
    let buttons = [
        {
            'label': 'OK',
            'value': true
        }, {
            'label': 'Cancel',
            'value': false
        }
    ];
    if (selectedTargets.length > max) {
        let selection = await chris.selectTarget('Give what targets disadvantage? (Max ' + max + ')', buttons, selectedTargets, true, 'multiple');
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
    for (let i = 0; selectedTargets.length > i; i++) {
        await chris.createEffect(selectedTargets[i].actor, effectData);
    }
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
    let sorcPointsItem = workflow.actor.items.getName('Sorcery Points');
    if (!sorcPointsItem) return;
    let sorcPointsValue = sorcPointsItem.system?.uses?.value;
    if (sorcPointsValue < 2) {
        ui.notifications.warn('No Sorcery Points Available!');
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
    let options = constants.syntheticItemWorkflowOptions([targetTokenUuid]);
    if (!options) return;
    options.workflowOptions.spellLevel = spellLevel;
    setProperty(spellData, 'flags.chris-premades.metaMagic', true);
    setProperty(spellData, 'flags.chris-premades.seekingSpell', damageRoll);
    spellData.name = workflow.item.name + ' Re-Roll';
    let spell = new CONFIG.Item.documentClass(spellData, {'parent': workflow.actor});
    await MidiQOL.completeItemUse(spell, {}, options);
    let damageFormula = ('0');
    let newDamageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(newDamageRoll);
    await sorcPointsItem.update({'system.uses.value': sorcPointsValue - 1});
    queue.remove(workflow.item.uuid);
}
async function transmutedSpell({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size === 0) return;
    if (workflow.item.type != 'spell' || workflow.item.flags['chris-premades']?.metaMagic) return;
    let sorcPointsItem = workflow.actor.items.getName('Sorcery Points');
    if (!sorcPointsItem) return;
    let sorcPointsValue = sorcPointsItem.system?.uses?.value;
    if (!sorcPointsValue) {
        ui.notifications.warn('No Sorcery Points Available!');
        return;
    }
    let values = ['acid', 'cold', 'fire', 'lightning', 'poison', 'thunder'];
    let oldDamageRoll = workflow.damageRoll;
    let oldFlavor = [];
    for (let i = 0; oldDamageRoll.terms.length > i; i++) {
        let flavor = oldDamageRoll.terms[i].flavor;
        let isDeterministic = oldDamageRoll.terms[i].isDeterministic;
        if (values.includes(flavor.toLowerCase()) && isDeterministic === false) {
            oldFlavor.push(flavor);
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
    for (let i = 0; values.length > i; i++) {
        if (values[i] != selectionOriginal) {
            options.push(values[i]);
        }
    }
    options = valuesToOptions(options);
    let selection = await chris.dialog('Change to what damage type?', options)
    let queueSetup = await queue.setup(workflow.item.uuid, 'transmutedSpell', 50);
    if (!queueSetup) return;
    let damageFormula = workflow.damageRoll._formula.replace(selectionOriginal, selection);
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    await sorcPointsItem.update({'system.uses.value': sorcPointsValue - 1});
    queue.remove(workflow.item.uuid);
}
async function twinnedSpell({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    if (workflow.item.type != 'spell' || workflow.item.system.range.units === 'self' || workflow.item.flags['chris-premades']?.metaMagic) return;
    let spellLevel = workflow.castData?.castLevel;
    if (spellLevel === 0) spellLevel = 1;
    if (!spellLevel) return;
    let sorcPointsItem = workflow.actor.items.getName('Sorcery Points');
    if (!sorcPointsItem) return;
    let sorcPointsValue = sorcPointsItem.system?.uses?.value;
    if (!sorcPointsValue) return;
    if (sorcPointsValue < spellLevel) {
        ui.notifications.warn('No Sorcery Points Available!');
        return;
    }
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
    let nearbyTargets = chris.findNearby(workflow.token, itemRange, disposition).filter(t => t.id != workflow.targets.first().id);
    if (nearbyTargets.length === 0) return;
    let buttons = [
        {
            'label': 'Yes',
            'value': true
        }, {
            'label': 'No',
            'value': false
        }
    ];
    let queueSetup = await queue.setup(workflow.item.uuid, 'twinnedSpell', 450);
    if (!queueSetup) return;
    let selected = await chris.selectTarget('Use Twinned Spell?', buttons, nearbyTargets, true, 'one');
    if (selected.buttons === false) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let targetTokenUuid = selected.inputs.find(id => id != false);
    if (!targetTokenUuid) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let spellData = duplicate(workflow.item.toObject());
    let options = constants.syntheticItemWorkflowOptions([targetTokenUuid]);
    options.workflowOptions.spellLevel = spellLevel;
    spellData.flags['chris-premades'] = {
        'metaMagic': true
    };
    workflow.item.flags['chris-premades'] = {
        'metaMagic': true
    };
    spellData.system.components.concentration = false;
    let spell = new CONFIG.Item.documentClass(spellData, {'parent': workflow.actor});
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(spell, {}, options);
    await sorcPointsItem.update({'system.uses.value': sorcPointsValue - spellLevel});
    if (workflow.item.system.components.concentration) {
        let concentrationsTargets = workflow.actor?.flags['midi-qol']['concentration-data']?.targets;
        concentrationsTargets.splice(0, 0, {'tokenUuid': targetTokenUuid, 'actorUuid': targetTokenUuid});
        await workflow.actor.setFlag('midi-qol', 'concentration-data.targets', concentrationsTargets);
    }
    queue.remove(workflow.item.uuid);
}
export let metaMagic = {
    carefulSpell: carefulSpell, //completed, onUse preSave
    empoweredSpell: empoweredSpell, //needs dialog, will be a passive effect, onUse postDamageRoll
    heightenedSpell: heightenedSpell, //completed, onUse preSave
    seekingSpell: seekingSpell, //completed, unsure about queue values, will be a passive effect, onUse postDamageRoll
    transmutedSpell: transmutedSpell, //completed, onUse postDamageRoll
    twinnedSpell: twinnedSpell //has issues with consuming spell slots, onUse postActiveEffects
}