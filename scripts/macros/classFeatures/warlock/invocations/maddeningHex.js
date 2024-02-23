import {chris} from '../../../../helperFunctions.js';
export async function maddeningHex({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let targets = chris.findNearby(workflow.targets.first(), 5, 'ally');
    if (targets.length === 0) return;
    let defaultDamageType = workflow.defaultDamageType;
    await chris.applyDamage(targets, workflow.damageTotal, defaultDamageType);
}