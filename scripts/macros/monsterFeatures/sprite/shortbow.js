import {chris} from '../../../helperFunctions.js'
export async function shortbow({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1 || workflow.failedSaves.size != 1) return;
    let targetActor = workflow.targets.first().actor;
    if (!chris.findEffect(targetActor, 'Poisoned')) return;
    let saveResult = workflow.saveResults[0].total;
    if (saveResult <= 5) await chris.addCondition(targetActor, 'Unconscious', false, workflow.item.uuid);
}