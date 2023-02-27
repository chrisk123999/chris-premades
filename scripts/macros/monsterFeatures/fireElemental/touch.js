import {chris} from '../../../helperFunctions.js';
export async function touch(workflow) {
    if (workflow.hitTargets.size != 1) return;
    let effect = chris.findEffect(workflow.actor, 'Fire Form');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [workflow.targets.first().document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
    };
    await MidiQOL.completeItemUse(originItem, {}, options);
}