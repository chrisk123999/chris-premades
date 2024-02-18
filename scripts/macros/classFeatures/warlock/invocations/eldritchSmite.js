import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
export async function eldritchSmite({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType)) return;
    let feature = chris.getItem(workflow.actor, 'Eldritch Smite');
    if (!feature) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'eldritchSmite', 250);
    if (!queueSetup) return;
    let pactSlots = workflow.actor.system.spells.pact.value;
    if (pactSlots === 0) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let pactLevel = workflow.actor.system.spells.pact.level;
    let selection = await chris.dialog(feature.name, constants.yesNo, 'Use Eldritch Smite?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let updates = {
        'system.spells.pact.value': pactSlots - 1
    }
    await workflow.actor.update(updates);
    let bonusDamage = (1 + pactLevel) + 'd8[force]';
    await chris.addToDamageRoll(workflow, bonusDamage);
    await feature.displayCard();
    let targetActor = workflow.targets.first().actor;
    let targetSize = chris.getSize(targetActor, false);
    let effect = chris.findEffect(targetActor, 'Prone');
    if (targetSize > 4 || effect) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let selection2 = await chris.dialog(feature.name, constants.yesNo, 'Knock target prone?');
    if (!selection2 || chris.checkTrait(targetActor, 'ci', 'prone')) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await chris.addCondition(targetActor, 'Prone', false, null);
    queue.remove(workflow.item.uuid);
}