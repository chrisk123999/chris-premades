import {dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';

async function late({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (workflow.item.system.actionType !== 'mwak') return;
    let feature = itemUtils.getItemByIdentifier(workflow.actor, 'stunningStrike');
    if (!feature) return;
    let ki = itemUtils.getItemByIdentifier(workflow.actor, 'ki');
    if (!ki || !ki.system.uses.value) return;
    let selection = await dialogUtils.confirm(feature.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: feature.name}));
    if (!selection) return;
    await workflowUtils.completeItemUse(feature);
}
export let stunningStrike = {
    name: 'Stunning Strike',
    version: '0.12.46',
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