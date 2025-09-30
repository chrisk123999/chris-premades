import {actorUtils, dialogUtils, effectUtils, genericUtils, rollUtils, workflowUtils} from '../../../../../utils.js';
async function attack({trigger: {entity: item}, workflow}) {
    if (workflow.attackRoll.isCritical || !workflow.targets.size || !item.system.uses.value || !workflowUtils.isAttackType(workflow, 'meleeWeaponAttack') || actorUtils.hasUsedReaction(workflow.actor) || !item.system.uses.value) return;
    if (workflow.targets.first().actor.system.attributes.ac.value > workflow.attackTotal) return;
    let effect = effectUtils.getAllEffectsByIdentifier(workflow.targets.first().actor, 'balefulInterdictEffect').find(effect => {
        let originItem = effectUtils.getOriginItemSync(effect);
        if (!originItem) return;
        if (originItem.actor.uuid === workflow.actor.uuid) return true;
    });
    if (!effect) return;
    let selection = await dialogUtils.confirmUseItem(item);
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(item, [workflow.targets.first()], {consumeResources: true, consumeUsage: true});
    await workflow.setAttackRoll(rollUtils.makeCritical(workflow.attackRoll));
    genericUtils.setProperty(workflow, 'chris-premades.deathstrike', true);
}
export let deathstrike = {
    name: 'Deathstrike',
    version: '1.3.78',
    rules: 'legacy',
    midi: {
        actor: [
            {
                pass: 'postAttackRoll',
                macro: attack,
                priority: 1000
            }
        ]
    }
};