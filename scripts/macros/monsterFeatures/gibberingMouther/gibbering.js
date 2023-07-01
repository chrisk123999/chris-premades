import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
async function allTurns(token, origin, range) {
    let targetToken = game.combat.scene.tokens.get(game.combat.current.tokenId);
    if (!targetToken || targetToken?.id === token.id) return;
    let distance = chris.getDistance(token, targetToken);
    if (distance > range) return;
    let [config, options] = constants.syntheticItemWorkflowOptions([targetToken.uuid]);
    await MidiQOL.completeItemUse(origin, config, options);
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