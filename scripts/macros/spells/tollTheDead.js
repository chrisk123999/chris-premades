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
    let damageFormula = workflow.damageRoll._formula.replace('d8', 'd12');
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}