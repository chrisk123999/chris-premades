import {chris} from '../../../helperFunctions.js';
export async function electrifiedBite(origin, token) {
    let turnToken = game.combat.scene.tokens.get(game.combat.current.tokenId);
    let turnActor = turnToken.actor;
    let originActor = origin.actor;
    if (originActor.id != turnActor.id) return;
    let damageRoll = await new Roll('1d8[piercing] + 3 + 2d6[lightning]').roll({'async': true});
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: {'alias': name},
        flavor: origin.name
    });
    await chris.applyDamage(token, damageRoll.total);
}