import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
export async function stunningStrike({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (workflow.item.system.actionType != 'mwak') return;
    let feature = chris.getItem(workflow.actor, 'Stunning Strike');
    if (!feature) return;
    let onHit = chris.getConfiguration(feature, 'onhit');
    if (!onHit) return;
    let ki = chris.getItem(workflow.actor, 'Ki Points');
    if (!ki) return;
    if (!ki.system.uses.value) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'stunningStrike', 450);
    if (!queueSetup) return;
    let selection = await chris.dialog(feature.name, constants.yesNo, 'Use ' + feature.name + '?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await warpgate.wait(100);
    let options = {
        'targetUuids': [workflow.targets.first().document.uuid]
    };
    await MidiQOL.completeItemUse(feature, {}, options);
    queue.remove(workflow.item.uuid);
}