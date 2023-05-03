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
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [targetToken.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
        'workflowOptions': {
            'autoRollDamage': 'always',
            'autoFastDamage': true
        }
    };
    await MidiQOL.completeItemUse(origin, {}, options);
}