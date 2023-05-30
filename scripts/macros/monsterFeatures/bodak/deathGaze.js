import {chris} from '../../../helperFunctions.js';
export async function deathGaze({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.failedSaves.size != 1) return;
    let targetToken = workflow.targets.first();
    if (chris.checkTrait(targetToken.actor, 'ci', 'frightened')) return;
    if ((workflow.saveResults[0].total + 5) > chris.getSpellDC(workflow.item)) return;
    let targetHP = targetToken.actor.system.attributes.hp.value;
    await chris.applyDamage([targetToken], targetHP, 'none');
}