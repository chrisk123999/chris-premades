import {chris} from '../../../helperFunctions.js';
async function allTurns(token, origin, range) {
    let targetToken = game.combat.scene.tokens.get(game.combat.current.tokenId);
    if (!targetToken || targetToken?.id === token.id) return;
    let distance = chris.getDistance(token, targetToken);
    if (distance > range) return;
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [targetToken.uuid],
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
async function effectCreation(origin) {
    let roll = await new Roll('1d8').roll({async: true});
    roll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: origin.name
    });
}
export let gibbering = {
    'allTurns': allTurns,
    'effectCreation': effectCreation
}