import {constants, dialogUtils, genericUtils, workflowUtils} from '../../utils.js';

async function damage({trigger: {entity: item}, workflow}) {
    if (!item.system.uses.value) return;
    if (!constants.weaponAttacks.includes(workflow.activity.actionType)) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    await workflowUtils.completeItemUse(item, {consumeUsage: true}, {configureDialog: false});
    let dieType = workflow.damageRolls[0].terms[0].faces;
    await workflowUtils.bonusDamage(workflow, '1d' + dieType + '[' + workflow.defaultDamageType + ']', {damageType: workflow.defaultDamageType});
}
export let orcishFury = {
    name: 'Orcish Fury: Extra Damage',
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