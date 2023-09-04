import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
async function favoredFoe({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (!constants.attacks.includes(workflow.item.actionType)) return;
    let originItem = chris.getItem(workflow.actor, 'Favored Foe');
    if (!originItem) return;
    let uses = originItem.system.uses.value;
    if (uses === 0) return;
    let targetToken = workflow.targets.first();
    let effect = targetToken.actor.effects.find(e => e.label === 'Favored Foe' && e.origin === originItem.uuid);
    if (effect) return;
    let queueSetup = await queue.setup(workflow.item.uuidk, 'favoredFoe', 250);
    if (!queueSetup) return;
    let selection = await chris.dialog(originItem.name, [['Yes,', true], ['No', false]], 'Use Favored Foe?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await originItem.update({'system.uses.value': uses - 1});
    let concentrationEffect = chris.findEffect(workflow.actor, 'Concentrating');
    if (concentrationEffect) await chris.removeEffect(concentrationEffect);
    
}