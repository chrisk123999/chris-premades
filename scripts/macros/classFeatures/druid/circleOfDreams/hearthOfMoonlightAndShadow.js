import {chris} from '../../helperFunctions.js';

async function item() {
    await warpgate.wait(50);
    let effectUpdates = {
        'flags': {
            'dae': {
                'transfer': false,
                'showIcon': true,
                'specialDuration': [
                    'shortRest',
                    'longRest'
                ],
                'stackable': 'noneName',
                'macroRepeat': 'none'
            }
        }
    }

    let templateEffect = chrisPremades.helpers.findEffect(workflow.actor, workflow.item.name + ' Template');    
    if (templateEffect) {
        await chrisPremades.helpers.updateEffect(templateEffect, effectUpdates);
    }
}

async function left(template, token) {
    const originActor = await fromUuid(template.flags["midi-qol"].actorUuid);
    if (token.actor === originActor) {
        const originItem = await fromUuid(template.flags["midi-qol"].itemUuid);
        let effect = chris.findEffect(token.actor, originItem.name + ' Template');
        if (effect) {
            await chris.removeEffect(effect);
        }
    }
}

export let hearthOfMoonlightAndShadow = {
    'item': item,
    'left' : left,
}
