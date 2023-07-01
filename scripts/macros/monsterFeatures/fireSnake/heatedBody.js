import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
export async function heatedBody(workflow, targetToken) {
    if (workflow.hitTargets.size === 0) return;
    if (!(workflow.item.system.actionType === 'mwak' || workflow.item.system.actionType === 'msak')) return;
    let distance = chris.getDistance(workflow.token, targetToken);
    if (distance > 5) return;
    let targetActor = targetToken.actor;
    let effect = chris.findEffect(targetActor, 'Heated Body');
    if (!effect) return;
    let feature = await fromUuid(effect.origin);
    if (!feature) return;
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.token.document.uuid]);
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature, config, options);
}