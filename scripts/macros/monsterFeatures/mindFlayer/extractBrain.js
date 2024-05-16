import {chris} from '../../../helperFunctions.js';
export async function extractBrain({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let target = workflow.targets.first().actor;
    if (target.system.attributes.hp.value != 0) return;
    let effect = chris.findEffect(target, 'Unconscious');
    if (effect) await chris.removeEffect(effect);
    let effect2 = chris.findEffect(target, 'Dead');
    if (effect2) return;
    await chris.addCondition(target, 'Dead', true, workflow.item.uuid);
}