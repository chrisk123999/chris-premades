import {dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function late({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (workflow.activity.actionType !== 'mwak') return;
    let ki = itemUtils.getItemByIdentifier(workflow.actor, 'ki');
    if (!ki || !ki.system.uses.value) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    await workflowUtils.completeItemUse(item);
}
export let stunningStrike = {
    name: 'Stunning Strike',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};