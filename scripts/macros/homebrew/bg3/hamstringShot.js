import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
import {constants} from '../../../constants.js';
async function turn(effect) {
    let turn = effect.flags['chris-premades']?.feature?.hamstringShot ?? 0;
    if (turn >= 1) {
        await chris.removeEffect(effect);
        return;
    } 
    let updates = {
        'flags.chris-premades.feature.hamstringShot': turn + 1
    };
    await chris.updateEffect(effect, updates);
}
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1 || workflow.item.system.actionType != 'rwak') return;
    let validTypes = [
        'shortbow',
        'longbow'
    ];
    if (!validTypes.includes(workflow.item.system.baseItem)) return;
    let feature = chris.getItem(workflow.actor, 'Hamstring Shot');
    if (!feature) return;
    if (!feature.system.uses.value) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'hamstringShot', 450);
    if (!queueSetup) return;
    let selection = await chris.dialog(feature.name, [['Yes', true], ['No', false]], 'Use Hamstring Shot?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await feature.update({'system.uses.value': 0});
    let featureData = duplicate(feature.toObject());
    delete (featureData._id);
    let feature2 = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.targets.first().document.uuid]);
    await warpgate.wait(100);
    let targetWorkflow = await MidiQOL.completeItemUse(feature2, config, options);
    if (targetWorkflow.failedSaves.size != 1) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let effect = chris.findEffect(workflow.targets.first().actor, 'Hamstrung');
    if (effect) await chris.updateEffect(effect, {'origin': feature.uuid});
    queue.remove(workflow.item.uuid);
}
export let hamstringShot = {
    'attack': attack,
    'turn': turn
}