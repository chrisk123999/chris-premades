import {dialogUtils, genericUtils, workflowUtils} from '../../../../utils.js';

async function damageApplication({trigger: {entity: item, token}, workflow, ditem}) {
    if (ditem.newHP || !ditem.oldHP) return;
    if (!item.system.uses.value) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
    if (!selection) return;
    await workflowUtils.completeItemUse(item, {consumeUsage: true});
    workflowUtils.setDamageItemDamage(ditem, ditem.oldHP - 1, true);
}
export let relentlessEndurance = {
    name: 'Relentless Endurance',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: damageApplication,
                priority: 50
            }
        ]
    }
};