import {chris} from '../../../helperFunctions.js';
export async function festeringAura(token, origin) {
    let targetToken = game.canvas.tokens.get(game.combat.current.tokenId);
    if (!targetToken) return;
    if (targetToken.id === token.id) return;
    let distance = chris.getDistance(token, targetToken);
    if (distance > 5) return;
    let effect = chris.findEffect(token.actor, 'Summoned Creature');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    if (originItem.actor.id === targetToken.actor.id) return;
    let [config, options] = constants.syntheticItemWorkflowOptions([targetToken.document.uuid]);
    await MidiQOL.completeItemUse(origin, config, options);
}