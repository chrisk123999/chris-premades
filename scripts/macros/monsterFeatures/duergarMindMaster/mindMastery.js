import {chris} from '../../../helperFunctions.js';
export async function mindMastery({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.failedSaves.size != 1) return;
    let targetActor = workflow.targets.first().actor;
    let effect = chris.findEffect(targetActor, 'Reaction');
    if (effect) return;
    await chris.addCondition(targetActor, 'Reaction', false);
}