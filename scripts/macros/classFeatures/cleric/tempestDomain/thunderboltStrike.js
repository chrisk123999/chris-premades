import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
export async function thunderboltStrike({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.hitTargets.size || !workflow.damageRoll) return;
    let feature = chris.getItem(workflow.actor, 'Thunderbolt Strike');
    if (!feature) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'thunderboltStrike', 475);
    if (!queueSetup) return;
    let damageTypes = chris.getRollDamageTypes(workflow.damageRoll);
    if (!damageTypes.has('lightning')) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let targets = Array.from(workflow.hitTargets).filter(i => chris.getSize(i.actor) <= 3);
    if (!targets.length) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let selection = await chris.selectTarget(feature.name + ': Push targets?', constants.yesNoButton, targets, true, 'multiple');
    if (!selection.buttons) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let pushTargets = selection.inputs.filter(i => i).map(i => fromUuidSync(i).object);
    if (!pushTargets.length) {
        queue.remove(workflow.item.uuid);
        return;
    }
    for (let i of pushTargets) chrisPremades.helpers.pushToken(workflow.token, i, 10);
    queue.remove(workflow.item.uuid);
}