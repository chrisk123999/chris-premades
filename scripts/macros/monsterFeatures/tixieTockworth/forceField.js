import {chris} from '../../../helperFunctions.js';
export async function forceField(token, origin) {
    let turnToken = game.combat.scene.tokens.get(game.combat.current.tokenId);
    let turnActor = turnToken.actor;
    let originActor = origin.actor;
    if (originActor.id != turnActor.id) return;
    let item = await originActor.items.getName(origin.name);
    if (item) item.use();
    await chris.applyDamage([token], 15, 'temphp');
    await chris.removeCondition(token.actor, 'Grappled');
    await chris.removeCondition(token.actor, 'Restrained');
    await chris.removeCondition(token.actor, 'Stunned');
}