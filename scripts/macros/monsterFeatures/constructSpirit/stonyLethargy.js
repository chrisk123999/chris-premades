import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.failedSaves.size != 1) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    await chris.addCondition(targetActor, 'Reaction', false, workflow.item.uuid);
}
async function turnStart(token, origin) {
    let targetToken = game.canvas.tokens.get(game.combat.current.tokenId);
    if (!targetToken) return;
    if (targetToken.document.disposition === token.document.disposition) return;
    let distance = chris.getDistance(token, targetToken);
    if (distance > 10) return;
    let [config, options] = constants.syntheticItemWorkflowOptions([targetToken.document.uuid]);
    await MidiQOL.completeItemUse(origin, config, options);
}
export let stoneLethargy = {
    'item': item,
    'turnStart': turnStart
}