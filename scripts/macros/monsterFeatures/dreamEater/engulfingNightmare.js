import {chris} from '../../../helperFunctions.js';
export async function engulfingNightmare(origin, token) {
    let turnToken = game.combat.scene.tokens.get(game.combat.current.tokenId);
    let turnActor = turnToken.actor;
    let originActor = origin.actor;
    if (originActor.id != turnActor.id) return;
    let damageRoll = await new Roll('3d6[psychic]').roll({async: true});
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: origin.name
    });
    await chris.applyDamage(token, damageRoll.total);
}