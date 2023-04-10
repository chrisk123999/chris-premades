import {chris} from '../../../helperFunctions.js';
export async function weightOfAges(token, origin) {
    let targetToken = game.canvas.tokens.get(game.combat.current.tokenId);
    if (!targetToken) return;
    if (targetToken.id === token.id) return;
    let distance = chris.getDistance(token, targetToken);
    if (distance > 5) return;
    let targetRace = chris.raceOrType(targetToken.actor);
    if (targetRace.toLowerCase() === 'elf') return;
    if (targetToken.actor.type === 'npc') {
        if (targetRace != 'beast' || targetRace != 'humanoid') return;
    }
    let effect = chris.findEffect(targetToken.actor, origin.name);
    if (effect) await chris.removeEffect(effect);
    let effectData = {
        'label': origin.name,
        'icon': origin.img,
        'origin': origin.uuid,
        'duration': {
            'rounds': 1
        },
        'changes': [
            {
                'key': 'system.attributes.movement.all',
                'mode': 0,
                'value': '-20',
                'priority': 20
            }
        ],
        'flags': {
            'dae': {
                'transfer': false,
                'specialDuration': [
                    'turnStartSource',
                    'combatEnd'
                ],
                'stackable': 'multi',
                'macroRepeat': 'none'
            }
        }
    }
    await chris.createEffect(targetToken.actor, effectData);
}