import {chris} from '../../../helperFunctions.js';
export async function heatedBody(workflow) {
    if (workflow.hitTargets.size != 1) return;
    if (!(workflow.item.system.actionType === 'mwak' || workflow.item.system.actionType === 'msak')) return;
    let targetToken = workflow.targets.first();
    let distance = chris.getDistance(workflow.token, targetToken);
    if (distance > 5) return;
    let targetActor = targetToken.actor;
    let effect = chris.findEffect(targetActor, 'Heated Body');
    if (!effect) return;
    let feature = await fromUuid(effect.origin);
    if (!feature) return;
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [workflow.token.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
    };
    await MidiQOL.completeItemUse(feature, {}, options);
}