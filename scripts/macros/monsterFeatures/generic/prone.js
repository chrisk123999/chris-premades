import {chris} from '../../../helperFunctions.js';
export async function prone({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1 || workflow.failedSaves.size != 1) return;
    let targetActor = workflow.targets.first().actor;
    let effect = chris.findEffect(targetActor, 'Prone');
    if (effect) return;
    await chris.addCondition(targetActor, 'Prone', false, workflow.item.uuid);
}