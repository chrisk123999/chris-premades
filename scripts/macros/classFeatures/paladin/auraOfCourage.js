import {chris} from '../../../helperFunctions.js';
export async function auraOfCourage(token, selectedAura) {
    let originToken = await fromUuid(selectedAura.tokenUuid);
    let originActor = originToken.actor;
    if (!originActor) return;
    let auraEffect = chris.findEffect(originActor, 'Aura of Courage - Aura');
    if (!auraEffect) return;
    let originItem = await fromUuid(auraEffect.origin);
    if (!originItem) return;
    let effectData = {
        'name': 'Aura of Courage',
        'icon': originItem.img,
        'origin': originItem.uuid,
        'duration': {
            'seconds': 604800
        },
        'changes': [
            {
                'key': 'system.traits.ci.value',
                'mode': 0,
                'value': 'frightened',
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'aura': true
            }
        }
    }
    let effect = chris.findEffect(token.actor, effectData.name);
    if (effect?.origin === effectData.origin) return;
    if (effect) chris.removeEffect(effect);
    await chris.createEffect(token.actor, effectData);
    let frightenedEffect = chris.findEffect(token.actor, 'Frightened');
    if (frightenedEffect) chris.removeEffect(frightenedEffect);
}