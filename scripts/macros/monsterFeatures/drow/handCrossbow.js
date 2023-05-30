import {chris} from '../../../helperFunctions.js';
export async function handCrossbow({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.failedSaves.size != 1 || workflow.hitTargets.size != 1) return;
    let targetActor = workflow.targets.first().actor;
    if (workflow.saveResults[0].total + 5 > workflow.item.system.save.dc) return;
    let isImmune = chris.checkTrait(targetActor, 'ci', 'poisoned');
    if (isImmune) return;
    await chris.addCondition(targetActor, 'Unconscious', true, workflow.item.uuid);
}