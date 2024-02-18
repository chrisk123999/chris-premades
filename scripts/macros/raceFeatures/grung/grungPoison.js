import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
import {constants} from '../../../constants.js';
import {translate} from '../../../translations.js';
export async function grungPoison({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.item || !workflow.damageRoll || workflow.item?.type != 'weapon' || workflow.hitTargets.size != 1) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'grungPoison', 300);
    if (!queueSetup) return;
    let damageTypes = chris.getRollDamageTypes(workflow.damageRoll);
    if (!damageTypes.has('piercing')) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let feature = chris.getItem(workflow.actor, 'Grung Poison');
    if (!feature) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let prompt = chris.getConfiguration(feature, 'prompt') ?? false;
    let selection = prompt ? await chris.dialog(feature.name, constants.yesNo, 'Use ' + feature.name + '?') : true;
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.targets.first().document.uuid]);
    await warpgate.wait(100);
    let featureWorkflow = await MidiQOL.completeItemUse(feature, config, options);
    if (featureWorkflow.failedSaves.size != 1) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let damageFormula = '2d4[' + translate.damageType('poison') + ']';
    await chris.addToDamageRoll(workflow, damageFormula, true);
    queue.remove(workflow.item.uuid);
}