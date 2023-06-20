import {chris} from '../../helperFunctions.js';
async function bestZone(token) {
    let templates = chris.tokenTemplates(token.document);
    let bestDC = null;
    let bestOriginUuid;
    for (let i of templates) {
        let testTemplate = canvas.scene.collections.templates.get(i);
        if (!testTemplate) continue;
        let testOriginUuid = testTemplate.flags['midi-qol']?.originUuid;
        if (!testOriginUuid) continue;
        let testOriginItem = await fromUuid(testOriginUuid);
        if (testOriginItem.name != 'Zone of Truth') continue;
        let testDC = chris.getSpellDC(testOriginItem);
        if (testDC > bestDC) {
            bestDC = testDC;
            bestOriginUuid = testOriginUuid;
        }
    }
    return bestOriginUuid;
}
async function inZone(token, template) {
    let originUuid = template.flags['midi-qol']?.originUuid;
    if (!originUuid) return;
    if (chris.inCombat()) {
        let turnEntered = template.flags['chris-premades']?.spell?.zoneOfTruth?.tokens?.[token.id];
        let currentTurn = game.combat.round + '-' + game.combat.turn;
        if (currentTurn === turnEntered) return;
        await template.setFlag('chris-premades', 'spell.zoneOfTruth.tokens.' + token.id, currentTurn);
    }
    let bestOriginUuid = await bestZone(token);
    if (bestOriginUuid != originUuid) return;
    let originItem = await fromUuid(originUuid);
    if (!originItem) return;
    let effectData = {
        'label': originItem.name,
        'icon': originItem.img,
        'duration': {
            'seconds': 600
        },
        'origin': originItem.uuid,
    };
    let effect = chris.findEffect(token.actor, 'Zone of Truth');
    if (effect) {
        if (effect.origin === originUuid) return;
        await chris.removeEffect(effect);
        await chris.createEffect(token.actor, effectData);
        return;
    }
    let spellObject = duplicate(originItem.toObject());
    delete(spellObject.flags.templatemacro);
    spellObject.system.range = {
        'value': null,
        'long': null,
        'units': ''
    };
    spellObject.system.target = {
        'value': 1,
        'width': null,
        'units': '',
        'type': 'creature'
    }
    spellObject.system.actionType = 'save';
    spellObject.system.save = {
        'ability': 'cha',
        'dc': chris.getSpellDC(originItem),
        'scaling': 'flat'
    }
    spellObject.system.preparation.mode = 'atwill';
    let spell = new CONFIG.Item.documentClass(spellObject, {'parent': originItem.actor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [token.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeQuantity': false,
        'consumeUsage': false,
        'consumeSlot': false,
        'workflowOptions': {
            'autoRollDamage': 'always',
            'autoFastDamage': true
        }
    };
    let spellWorkflow = await MidiQOL.completeItemUse(spell, {}, options);
    if (spellWorkflow.failedSaves.size != 1) return;
    await chris.createEffect(token.actor, effectData);
}
async function leaveZone(token, template) {
    if (chris.inCombat()) {
        await template.setFlag('chris-premades', 'spell.zoneOfTruth.tokens.' + token.id, '');
    }
    let effect = chris.findEffect(token.actor, 'Zone of Truth');
    if (!effect) return;
    let originUuid = template.flags['midi-qol']?.originUuid;
    if (!originUuid) return;
    if (effect.origin != originUuid) return;
    let bestOriginUuid = await bestZone(token);
    if (!bestOriginUuid) await chris.removeEffect(effect);
}
export let zoneOfTruth = {
    'inZone': inZone,
    'leaveZone': leaveZone
}