import {constants, dialogUtils, genericUtils, workflowUtils} from '../../utils.js';

async function damage({trigger: {entity: item}, workflow}) {
    if (!item.system.uses.value) return;
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType)) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    await workflowUtils.completeItemUse(item, {consumeUsage: true}, {configureDialog: false});
    let dieType = workflow.damageRolls[0].terms[0].faces;
    await workflowUtils.bonusDamage(workflow, '1d' + dieType + '[' + workflow.defaultDamageType + ']', {damageType: workflow.defaultDamageType});
}
export let orcishFury = {
    name: 'Orcish Fury: Extra Damage',
    version: '0.12.70',
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