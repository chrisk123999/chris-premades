import {dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function late({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!workflowUtils.isAttackType(workflow, 'meleeAttack')) return;
    let ki = itemUtils.getItemByIdentifier(workflow.actor, 'ki');
    if (!ki || !ki.system.uses.value) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    await workflowUtils.completeItemUse(item);
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['save'], 'ki');
}
export let stunningStrike = {
    name: 'Stunning Strike',
    version: '1.5.35',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 45
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 45
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 45
        }
    ]
};