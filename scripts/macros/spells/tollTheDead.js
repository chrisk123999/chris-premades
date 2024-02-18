import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function tollTheDead({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let targetActor = targetToken.actor;
    let queueSetup = await queue.setup(workflow.item.uuid, 'tollTheDead', 50);
    if (!queueSetup) return;
    if (targetActor.system.attributes.hp.value === targetActor.system.attributes.hp.max) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let damageFormula = workflow.damageRolls[0]._formula.replace('d8', 'd12');
    let damageRoll = await chris.damageRoll(workflow, damageFormula);
    workflow.damageRolls[0] = damageRoll;
    await workflow.setDamageRolls(workflow.damageRolls);
    queue.remove(workflow.item.uuid);
}