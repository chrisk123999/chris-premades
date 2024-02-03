import {chris} from '../../../helperFunctions.js';
export async function auraOfProtection(token, selectedAura) {
    let originToken = await fromUuid(selectedAura.tokenUuid);
    if (!originToken) return;
    let originActor = originToken.actor;
    let auraEffect = chris.findEffect(originActor, 'Aura of Protection - Aura');
    if (!auraEffect) return;
    let originItem = await fromUuid(auraEffect.origin);
    if (!originItem) return;
    let effectData = {
        'name': 'Aura of Protection',
        'icon': originItem.img,
        'origin': originItem.uuid,
        'duration': {
            'seconds': 604800
        },
        'changes': [
            {
                'key': 'system.bonuses.abilities.save',
                'mode': 2,
                'value': '+' + selectedAura.castLevel,
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'aura': true,
                'effect': {
                    'noAnimation': true
                }
            }
        }
    };
    let effect = chris.findEffect(token.actor, effectData.name);
    if (effect?.origin === effectData.origin) return;
    if (effect) chris.removeEffect(effect);
    await chris.createEffect(token.actor, effectData);
}