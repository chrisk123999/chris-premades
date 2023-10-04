import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    if (!constants.attacks.contains(workflow.item.system.actionType)) return;
    let effect = chris.findEffect(workflow.actor, 'Compelled Duel - Target');
    if (!effect) return;
    if (!effect.origin) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'compelledDuel', 50);
    if (!queueSetup) return;
    let origin = await fromUuid(effect.origin);
    if (!origin) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let targetUuid = workflow.targets.first().uuid;
    let sourceUuid = effect.flags['chris-premades']?.spell?.compelledDuel?.sourceUuid;
    if (!sourceUuid) return;
    if (targetUuid === sourceUuid) {
        queue.remove(workflow.item.uuid);
        return;
    }
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add('Disadvantage: ' + origin.name);
    queue.remove(workflow.item.uuid);
}
async function attacker({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.token);
    if (!workflow.targets.size) return;
    let effect = chris.findEffect(workflow.actor, 'Compelled Duel - Source');
    if (!effect) return;
    let targetUuid = effect.flags['chris-premades']?.spell?.compelledDuel?.targetUuid;
    if (!targetUuid) return;
    let endSpell = false;
    for (let i of workflow.targets) {
        if (constants.attacks.contains(workflow.item.actionType)) {
            if (i.uuid != targetUuid) {
                endSpell = true;
                break;
            } else {
                continue;
            }
        }
        let disposition = i.document.disposition;
        if (disposition != workflow.token.document.disposition) {
            if (i.uuid != targetUuid) {
                endSpell = true;
                break;
            }
        }
    }
    if (!endSpell) return;
    let targetToken = await fromUuid(targetUuid);
    if (!targetToken) return;
    let effect2 = chris.findEffect(targetToken.actor, 'Compelled Duel - Target');
    if (!effect2) return;
    await chris.removeEffect(effect2);
}


export let compelledDuel = {
    'attack': attack
}