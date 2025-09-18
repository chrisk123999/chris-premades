import {activityUtils, constants, dialogUtils, genericUtils, workflowUtils} from '../../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!constants.weaponAttacks.includes(workflowUtils.getActionType(workflow))) return;
    if (workflow.item.type !== 'weapon');
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('piercing')) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    let feature = activityUtils.getActivityByIdentifier(item, 'grungPoison', {strict: true});
    if (!feature) return;
    await workflowUtils.syntheticActivityRoll(feature, [workflow.hitTargets.first()]);
}
export let poisonousSkin = {
    name: 'Poisonous Skin',
    version: '1.1.10',
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