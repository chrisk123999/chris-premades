import {chris} from '../../helperFunctions.js';

async function created(template) {
    await warpgate.wait(50);
    const originItem = await fromUuid(template.flags["midi-qol"].itemUuid);
    let effectData = {
        'name': originItem.name,
        'icon': originItem.img,
        'origin': template.uuid,
        'duration': {
        
        },
        'changes': [
            {
                'key': 'flags.dae.deleteUuid',
                'mode': 5,
                'priority': 20,
                'value': template.uuid
            }
        ],
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
    
    const originActor = await fromUuid(template.flags["midi-qol"].actorUuid);
    await chris.createEffect(originActor, effectData);
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
