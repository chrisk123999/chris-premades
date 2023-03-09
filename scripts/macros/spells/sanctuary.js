import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
export async function sanctuary(workflow) {
    let invalidTypes = [
        'cone',
        'cube',
        'cylinder',
        'line',
        'radious',
        'sphere',
        'square',
        'wall'
    ];
    if (invalidTypes.includes(workflow.item.system.target.type)) return;
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let targetEffect = chris.findEffect(targetActor, 'Sanctuary');
    if (!targetEffect) return;
    let targetItem = await fromUuid(targetEffect.origin);
    if (!targetItem) return;
    let spellItem = duplicate(targetItem.toObject());
    spellItem.system.save.ability = 'wis';
    spellItem.system.preparation.mode = 'atwill';
    delete(spellItem.effects);
    let spell = new CONFIG.Item.documentClass(spellItem, {parent: targetItem.actor});
    let options = {
        'showFullCard': false,
        'createWorkflow': true,
        'targetUuids': [workflow.token.document.uuid],
        'configureDialog': false,
        'versatile': false,
        'consumeResource': false,
        'consumeSlot': false,
    };
    let queueSetup = await queue.setup(workflow.item.uuid, 'sanctuary', 48);
    if (!queueSetup) return;
    let spellWorkflow = await MidiQOL.completeItemUse(spell, {}, options);
    if (spellWorkflow.failedSaves.size != 1) {
        queue.remove(workflow.item.uuid);
        return;
    }
    queue.remove(workflow.item.uuid);
    return false;
}