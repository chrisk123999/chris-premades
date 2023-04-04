import {chris} from '../../../helperFunctions.js';
async function allTurns(token, origin) {
    let targetToken = game.combat.scene.tokens.get(game.combat.current.tokenId);
    if (!targetToken || targetToken?.id === token.id) return;
    let distance = chris.getDistance(token, targetToken);
    if (distance > 10) return;
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [targetToken.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
    };
    await MidiQOL.completeItemUse(origin, {}, options);
}
async function turnStart(origin) {
    let roll = await new Roll('1d8').roll({async: true});
    roll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: origin.name
    });
}
export let gibbering = {
    'allTurns': allTurns,
    'turnStart': turnStart
}