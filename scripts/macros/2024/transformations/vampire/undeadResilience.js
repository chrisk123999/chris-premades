import {dialogUtils, socketUtils, workflowUtils} from '../../../../utils.js';
async function damageApplication({trigger: {entity: item}, workflow, ditem}) {
    if (ditem.newHP > 0 || !ditem.isHit) return;
    if (!item.system.uses.value) return;
    if (workflowUtils.getDamageTypes(workflow.damageRolls).has('radiant')) return;
    let selection = await dialogUtils.confirmUseItem(item, {userId: socketUtils.firstOwner(item.actor, true)});
    if (!selection) return;
    workflowUtils.preventDeath(ditem);
    let target = await fromUuid(ditem.targetUuid);
    await workflowUtils.syntheticItemRoll(item, [target.object], {consumeResources: true, consumeUsage: true});
}
export let undeadResilience = {
    name: 'Stage 2 Boon: Undead Resilience',
    version: '1.5.4',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: damageApplication,
                priority: 245
            }
        ]
    }
};