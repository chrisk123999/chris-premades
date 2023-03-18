import {chris} from '../../../helperFunctions.js'
export async function reanimate(token, origin) {
    let originActor = origin.actor;
    if (!originActor) return;
    let stenchEffect = chris.findEffect(originActor, 'Stench of Death Immunity');
    if (!stenchEffect) return;
    let originItem = await fromUuid(stenchEffect.origin);
    await chrisPremades.macros.monster.hezrou.stench(token, origin, 10, 86400, 'corpse-flower', originItem);
}