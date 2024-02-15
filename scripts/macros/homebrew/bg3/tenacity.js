import {chris} from '../../../helperFunctions.js';
import {constants} from '../../../constants.js';
import {queue} from '../../../utility/queue.js';
export async function tenacity({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!(workflow.targets.size === 1 && !workflow.hitTargets.size) || workflow.item.system.actionType != 'mwak') return;
    let validTypes = [
        'morningstar',
        'greatclub',
        'moul'
    ];
    let baseItem = workflow.item.system.type?.baseItem;
    if (!validTypes.includes(baseItem)) return;
    let feature = chris.getItem(workflow.actor, 'Tenacity');
    if (!feature) return;
    if (!feature.system.uses.value) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'rushAttack', 450);
    if (!queueSetup) return;
    let selection = await chris.dialog(feature.name, constants.yesNo, 'Use Tenacity?');
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
    await MidiQOL.completeItemUse(feature2, config, options);
    queue.remove(workflow.item.uuid);
}