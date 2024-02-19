import {chris} from '../../../../helperFunctions.js';
async function aura(token, selectedAura) {
    let originToken = await fromUuid(selectedAura.tokenUuid);
    if (!originToken) return;
    let originActor = originToken.actor;
    let auraEffect = chris.findEffect(originActor, 'Aura of Hate - Aura');
    if (!auraEffect) return;
    let originItem = auraEffect.parent;
    if (!originItem) return;
    let effectData = {
        'name': 'Aura of Hate',
        'icon': originItem.img,
        'origin': originItem.uuid,
        'duration': {
            'seconds': 604800
        },
        'changes': [
            {
                'key': 'system.bonuses.mwak.damage',
                'mode': 2,
                'value': '+ ' + selectedAura.castLevel,
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
async function special(sourceToken, targetToken) {
    if (sourceToken.disposition === targetToken.disposition) return true;
    let validTypes = [
        'undead',
        'fiend'
    ];
    if (validTypes.includes(chris.raceOrType(targetToken.actor))) return true;
    return false;
}
export let auraOfHate = {
    'aura': aura,
    'special': special
}