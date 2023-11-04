import {chris} from '../../../../helperFunctions.js';
export async function formOfTheBeast({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (workflow.appliedDamage === 0) return;
    if (!chris.perTurnCheck(workflow.item, 'feature', 'formOfTheBeast', true, workflow.token.id)) return;
    let maxHP = workflow.actor.system.attributes.hp.max;
    let currentHP = workflow.actor.system.attributes.hp.value;
    if (Math.ceil(maxHP / 2) <= currentHP) return;
    await chris.applyDamage([workflow.token], workflow.actor.system.attributes.prof, 'healing');
    await chris.setTurnCheck(workflow.item, 'feature', 'formOfTheBeast');
}