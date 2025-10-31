import {dialogUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let weapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.equipped);
    if (!weapons.length) return;
    let selection = weapons[0];
    if (weapons.length > 1) {
        selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.Attack.SelectWeapon', weapons);
        if (!selection) return;
    }
    await workflowUtils.syntheticItemRoll(selection, Array.from(workflow.targets), {consumeResources: true, consumeUsage: true});
}
export let attack = {
    name: 'Attack',
    version: '1.3.115',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};