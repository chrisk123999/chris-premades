import {chris} from '../../../helperFunctions.js';
export async function hungryJaws(workflow) {
    if (workflow.hitTargets.size === 0) return;
    let profBonus = workflow.actor.system.attributes.prof;
    await chris.applyDamage(workflow.token, profBonus, 'temphp');
}