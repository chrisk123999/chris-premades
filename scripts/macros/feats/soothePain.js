import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function soothePain(targetToken, {workflow, ditem}) {
    if (ditem.newHP >= ditem.oldHP) return;
    let queueSetup = await queue.setup(workflow.uuid, 'soothePain', 350);
    if (!queueSetup) return;
    let reactionTargets = chris.findNearby(targetToken, 30, 'ally', false, true).filter(t =>
        !chris.findEffect(t.actor, 'Reaction') &&
        chris.getItem(t.actor, 'Righteous Heritor: Soothe Pain')?.system?.uses?.value > 0 &&
        chris.getDistance(t, targetToken) <= 30
    );
    if (!reactionTargets.length) {
        queue.remove(workflow.uuid);
        return;
    }
    for (let reactor of reactionTargets) {
        let feature = chris.getItem(reactor.actor, 'Righteous Heritor: Soothe Pain');
        if (!feature) continue;
        let firstOwner = chris.firstOwner(reactor);
        await chris.thirdPartyReactionMessage(firstOwner);
        let message = 'Protect ' + targetToken.actor.name + ' with ' + feature.name + '?';
        if (firstOwner.isGM) message = '[' + reactor.actor.name + '] ' + message;
        let selection = await chris.remoteDialog(feature.name, constants.yesNo, firstOwner.id, message);
        if (!selection) continue;
        let updates = {
            'embedded': {
                'Item': {
                    [feature.name]: {
                        'system.uses.value': feature.system.uses.value - 1
                    }
                }
            }
        };
        let options2 = {
            'permanent': true,
            'name': feature.name,
            'description': feature.name
        };
        await warpgate.mutate(reactor.document, updates, {}, options2);
        let [config, options] = constants.syntheticItemWorkflowOptions([targetToken.document.uuid]);
        await warpgate.wait(100);
        let featureWorkflow = await MidiQOL.completeItemUse(feature, config, options);
        chris.removeDamageDetailDamage(ditem, targetToken, featureWorkflow.damageTotal);
        break;
    }
    await chris.clearThirdPartyReactionMessage();
    queue.remove(workflow.uuid);
}