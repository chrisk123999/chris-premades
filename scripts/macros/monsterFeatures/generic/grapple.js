import {chris} from '../../../helperFunctions.js';
export async function grapple({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let sourceRoll = await workflow.actor.rollSkill('ath');
    let targetActor = workflow.targets.first().actor;
    let targetRoll;
    if (targetActor.system.skills.acr.total >= targetActor.system.skills.ath.total) {
        targetRoll = await targetActor.rollSkill('acr');
    } else {
        targetRoll = await targetActor.rollSkill('ath');
    }
    if (targetRoll.total > sourceRoll.total) return;
    await chris.addCondition(targetActor, 'Grappled', false, workflow.item.uuid);
}