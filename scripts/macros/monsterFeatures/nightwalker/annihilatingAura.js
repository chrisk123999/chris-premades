import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
export async function annihilatingAura(token, origin) {
    let targetToken = game.canvas.tokens.get(game.combat.current.tokenId);
    if (!targetToken) return;
    if (targetToken.document.uuid === token.document.uuid) return;
    if (chris.raceOrType(targetToken.actor) === 'undead') return;
    let distance = chris.getDistance(token, targetToken);
    if (distance > 30) return;
    let [config, options] = constants.syntheticItemWorkflowOptions([targetToken.document.uuid]);
    await MidiQOL.completeItemUse(origin, config, options);
}