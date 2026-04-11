import {effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function attack({trigger: {entity: item}, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'attack') || workflow.hitTargets.size) return;
    await workflowUtils.syntheticItemRoll(item, [workflow.targets.first()]);
    let sourceEffect = item.effects.contents?.[0];
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    effectData.changes[0].value = 'workflow.token.id === "' + workflow.token.id + '"';
    await effectUtils.createEffect(workflow.targets.first().actor, effectData);
}
export let studiedAttacks = {
    name: 'Studied Attacks',
    version: '1.5.19',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'post',
                macro: attack,
                priority: 200
            }
        ]
    }
};