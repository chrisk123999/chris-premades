import {chris} from '../../helperFunctions.js';

async function created(template) {
    wait(50)
    const originItem = await fromUuid(template.flags["midi-qol"].itemUuid);
    let effectData = {
        'name': originItem.name,
        'icon': originItem.img,
        'origin': template.uuid,  //Not item Uuid to prevent AA from killing the animation on the source actor.
        'duration': {
        
        },
        'changes': [
            {
              'key': 'system.skills.prc.bonuses.check',
              'mode': 2,
              'value': '+5',
              'priority': 20
            },
            {
              'key': 'system.skills.ste.bonuses.check',
              'mode': 2,
              'value': '+5',
              'priority': 20
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
    let containedIds = game.modules.get("templatemacro").api.findContained(template);
    containedIds.forEach((tokenId) =>
        let token = fromUuid(tokenId);
        await chris.createEffect(token.actor, effectData);
    );
}

async function entered(template, token) {
    const originItem = await fromUuid(template.flags["midi-qol"].itemUuid);
    let effectData = {
        'name': originItem.name,
        'icon': originItem.img,
        'origin': template.uuid,  //Not item Uuid to prevent AA from killing the animation on the source actor.
        'duration': {
        
        },
        'changes': [
            {
              'key': 'system.skills.prc.bonuses.check',
              'mode': 2,
              'value': '+5',
              'priority': 20
            },
            {
              'key': 'system.skills.ste.bonuses.check',
              'mode': 2,
              'value': '+5',
              'priority': 20
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

    await chris.createEffect(token.actor, effectData);
}

async function left(template, token) {
    const originActor = await fromUuid(template.flags["midi-qol"].actorUuid);
    if (token.actor === originActor) {
        await template.delete()
    }
    else {
        const originItem = await fromUuid(template.flags["midi-qol"].itemUuid);
        let effect = chris.findEffect(token.actor, originItem.name);
        await chris.removeEffect(effect);
    }
}

async function removed(template) {
    const originItem = await fromUuid(template.flags["midi-qol"].itemUuid);
    let tokens = game.canvas.scene.tokens.filter(i => chris.getEffects(i.actor).find(j => j.origin === template.uuid));
    for (let token of tokens) {
        let templates = chris.tokenTemplates(token).map(i => canvas.scene.templates.get(i)).filter(j => j.flags.dnd5e?.origin != template.flags.dnd5e.origin);
        if (templates.length) return;
        let effect = chris.findEffect(token.actor, originItem.name);
        await chris.removeEffect(effect);
    }
}

export let hearthOfMoonlightAndShadow = {
    'created': created,
    'entered': entered,
    'left' : left,
    'removed': removed
}
