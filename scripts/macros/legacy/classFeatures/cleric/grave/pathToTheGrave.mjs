import {documentUtils, effectUtils, workflowUtils} from '../../../../../proxy.mjs';
async function onHit({document: effect, workflow}) {
    if (!workflow.hitTargets.count || !workflowUtils.isAttackType(workflow, 'attack')) return;
    const types = Array.from(workflowUtils.getDamageTypes(workflow.damageRolls));
    await documentUtils.update(effect, {'system.changes': types.map(t =>
        ({key: 'system.traits.dv.value', type: 'add', value: t})
    )});
    workflowUtils.setWorkflowProperty(workflow, 'pathToTheGraveUsed', true);
    await (await effectUtils.getOriginActivity(effect))?.item.displayCard();
}
async function remove({document: effect, workflow}) {
    if (!workflowUtils.getWorkflowProperty(workflow, 'pathToTheGraveUsed')) return;
    await documentUtils.deleteDocument(effect);
}
export const pathToTheGrave = {
    name: 'Path to the Grave',
    version: '2.1.9',
    rules: '2014',
    roll: [
        {
            pass: 'targetDamageRollComplete',
            macro: onHit,
            priority: 300
        },
        {
            pass: 'targetRollFinished',
            macro: remove,
            priority: 300
        }
    ]
};
