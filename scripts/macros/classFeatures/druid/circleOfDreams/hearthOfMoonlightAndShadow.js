import {chris} from '../../helperFunctions.js';

async function created(template) {
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

    let originItem = await fromUuid(template.flags["midi-qol"].itemUuid);
    let originActor = await fromUuid(template.flags["midi-qol"].actorUuid);
    let templateEffect = chris.findEffect(originActor, originItem.name + 'Template');

    if (templateEffect) {
        await chris.updateEffect(templateEffect, effectUpdates);
    }
}

async function left(template, token) {
    const originActor = await fromUuid(template.flags["midi-qol"].actorUuid);
    if (token.actor === originActor) {
        await template.delete()
        let effect = chris.findEffect(token.actor, originItem.name);
        await chris.removeEffect(effect);
    }
}

export let hearthOfMoonlightAndShadow = {
    'created': created,
    'left' : left,
}
