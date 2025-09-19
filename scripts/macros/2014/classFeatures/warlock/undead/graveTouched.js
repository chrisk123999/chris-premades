import {combatUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../../../utils.js';

async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    if (!combatUtils.perTurnCheck(item, 'graveTouched', true, workflow.token.id)) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    await workflowUtils.completeItemUse(item);
    await combatUtils.setTurnCheck(item, 'graveTouched');
    let newRolls = [];
    for (let roll of workflow.damageRolls) {
        newRolls.push(rollUtils.getChangedDamageRoll(roll, 'necrotic'));
    }
    await workflow.setDamageRolls(newRolls);
    let formOfDread = effectUtils.getEffectByIdentifier(workflow.actor, 'formOfDread');
    if (formOfDread) {
        let bonusFormula = '1d' + workflow.damageRoll.dice[0].faces + '[necrotic]';
        await workflowUtils.bonusDamage(workflow, bonusFormula, {damageType: 'necrotic'});
    }
}
export let graveTouched = {
    name: 'Grave Touched',
    version: '1.1.0',
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