import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
export async function reaper({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    if (workflow.item.type != 'spell' || workflow.item.system.level != 0 || workflow.item.system.school != 'nec' || workflow.item.flags['chris-premades']?.reap) return;
    let targetToken = workflow.targets.first();
    let nearbyTargets = chris.findNearby(targetToken, 5, 'ally');
    if (nearbyTargets.length === 0) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'reaper', 450);
    if (!queueSetup) return;
    let selected = await chris.selectTarget('Use Reaper?', constants.yesNo, nearbyTargets, true, 'one');
    if (selected.buttons === false) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let targetTokenUuid = selected.inputs.find(id => id != false);
    if (!targetTokenUuid) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let effect = chris.findEffect(workflow.actor, 'Reaper');
    let originItem = effect.parent;
    if (originItem)    await originItem.use();
    let [config, options] = constants.syntheticItemWorkflowOptions([targetTokenUuid]);
    let spellData = duplicate(workflow.item.toObject());
    spellData.flags['chris-premades'] = {
        'reap': true
    };
    let spell = new CONFIG.Item.documentClass(spellData, {'parent': workflow.actor});
    spell.prepareData();
    spell.prepareFinalAttributes();
    await MidiQOL.completeItemUse(spell, config, options);
    queue.remove(workflow.item.uuid);
}