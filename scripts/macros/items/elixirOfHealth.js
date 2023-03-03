import {chris} from '../../helperFunctions.js';
export async function elixirOfHealth(workflow) {
    if (workflow.targets.size != 1) return;
    let targetActor = workflow.targets.first().actor;
    await chris.removeCondition(targetActor, 'Blinded');
    await chris.removeCondition(targetActor, 'Deafened');
    await chris.removeCondition(targetActor, 'Paralyzed');
    await chris.removeCondition(targetActor, 'Poisoned');
}