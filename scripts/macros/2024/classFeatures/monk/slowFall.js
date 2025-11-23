import {actorUtils, dialogUtils, genericUtils, socketUtils, workflowUtils} from '../../../../utils.js';
async function damageApplication({trigger: {entity: item}, workflow, ditem}) {
    if (ditem.newHP === ditem.oldHP || !ditem.isHit) return;
    if (actorUtils.hasUsedReaction(item.actor)) return;
    let identifier = genericUtils.getIdentifier(workflow.item);
    if (identifier != 'fall') return;
    let selection = await dialogUtils.confirmUseItem(item, {userId: socketUtils.firstOwner(item.actor, true)});
    if (!selection) return;
    let targetWorkflow = await workflowUtils.syntheticItemRoll(item, [workflow.targets.first()]);
    workflowUtils.modifyDamageAppliedFlat(ditem, -targetWorkflow.utilityRolls[0].total);
}
export let slowFall = {
    name: 'Slow Fall',
    version: '1.3.141',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: damageApplication,
                priority: 100
            }
        ]
    }
};