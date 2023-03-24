import {chris} from '../../../helperFunctions.js';
import {effectAura} from '../../../movement.js';
async function effectCreation(token, actor, effect, origin) {
    let castLevel = actor.system.abilities.cha.mod;
    let sourceActorUuid = actor.uuid;
    let range = 10;
    let paladinLevels = actor.classes.paladin?.system?.levels;
    if (!paladinLevels) return;
    if (paladinLevels >= 18) range = 30;
    let targetDisposition = 'ally';
    let conscious = true;
    let effectData = {
        'label': 'Aura of Courage',
        'icon': origin.img,
        'origin': origin.uuid,
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
        ]
    }
    await effectAura.add('auraOfCourage', castLevel, 10, sourceActorUuid, range, targetDisposition, conscious, effectData, effect.uuid);
}
async function moved(token, castLevel, spellDC, effectData, tokenID) {
    let effect = chris.findEffect(token.actor, effectData.label);
    if (effect?.origin === effectData.origin) return;
    if (effect) chris.removeEffect(effect);
    await chris.createEffect(token.actor, effectData);
    let frightenedEffect = chris.findEffect(token.actor, 'Frightened');
    if (frightenedEffect) chris.removeEffect(frightenedEffect);
}
async function effectEnd(token ,effect) {
    await effectAura.refresh(effect.uuid);
    await effectAura.remove('auraOfCourage', token.actor.uuid);
}
export let auraOfCourage = {
    'start': effectCreation,
    'moved': moved,
    'end': effectEnd
}