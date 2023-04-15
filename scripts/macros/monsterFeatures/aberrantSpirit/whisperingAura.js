import {chris} from '../../../helperFunctions.js';
export async function whisperingAura(actor, origin) {
    let incapacitatedEffect = chris.findEffect(actor, 'Incapacitated');
    if (incapacitatedEffect) return;
    let hp = actor.system.attributes.hp.value;
    if (!hp) return;
    await origin.use();
}