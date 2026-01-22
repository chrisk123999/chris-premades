import {combatUtils, dialogUtils, effectUtils, genericUtils, rollUtils, workflowUtils} from '../../../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    if (!item.system.uses.value) return;
    if (!combatUtils.isOwnTurn(workflow.token)) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(item, [workflow.token], {consumeResources: true, consumeUsage: true});
    workflow.damageRolls = workflow.damageRolls.map(roll => {
        return rollUtils.getChangedDamageRoll(roll, 'necrotic');
    });
    await workflow.setDamageRolls(workflow.damageRolls);
    let formOfDread = effectUtils.getEffectByIdentifier(workflow.actor, 'formOfDreadActive');
    if (formOfDread) await workflowUtils.bonusDamage(workflow, '1d' + workflow.damageRolls[0].dice[0].faces, {damageType: 'necrotic'});
}
export let graveTouched = {
    name: 'Grave Touched',
    version: '1.4.23',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};