import {chris} from '../../../../helperFunctions.js';
export async function auraOfAlacrity(token, origin) {
    let targetToken = game.canvas.tokens.get(game.combat.current.tokenId);
    if (!targetToken) return;
    if (targetToken.id === token.id) return;
    if (targetToken.document.disposition != token.document.disposition) return;
    let distance = chris.getDistance(token, targetToken);
    let auraDistance = 5;
    if (token.actor.classes.paladin?.system?.levels >= 18) auraDistance = 10;
    if (distance > auraDistance) return;
    let effect = chris.findEffect(targetToken.actor, 'Aura of Alacrity');
    if (effect) await chris.removeEffect(effect);
    let effectData = {
        'label': 'Aura of Alacrity',
        'icon': origin.img,
        'origin': origin.uuid,
        'duration': {
            'turns': 1
        },
        'changes': [
            {
                'key': 'system.attributes.movement.walk',
                'mode': 2,
                'value': '+10',
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'aura': true
            }
        }
    }
    await chris.createEffect(targetToken.actor, effectData);
}