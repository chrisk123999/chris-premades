import {chris} from '../../../../helperFunctions.js';
export async function auraOfDevotion(token, selectedAura) {
    let originToken = await fromUuid(selectedAura.tokenUuid);
    if (!originToken) return;
    let originActor = originToken.actor;
    let auraEffect = chris.findEffect(originActor, 'Aura of Devotion - Aura');
    if (!auraEffect) return;
    let originItem = await fromUuid(auraEffect.origin);
    if (!originItem) return;
    let effectData = {
        'label': 'Aura of Devotion',
        'icon': originItem.img,
        'origin': originItem.uuid,
        'duration': {
            'seconds': 604800
        },
        'changes': [
            {
                'key': 'system.traits.ci.value',
                'mode': 0,
                'value': 'charmed',
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'aura': true
            }
        }
    }
    let effect = chris.findEffect(token.actor, effectData.label);
    if (effect?.origin === effectData.origin) return;
    if (effect) chris.removeEffect(effect);
    await chris.createEffect(token.actor, effectData);
}