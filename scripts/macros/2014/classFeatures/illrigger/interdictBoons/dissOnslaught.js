import {dialogUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.token || !workflow.targets.size) return;
    let weapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.equipped);
    if (!weapons.length) return;
    let selection;
    if (weapons.length === 1) {
        selection = weapons[0];
    } else {
        selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectAWeapon', weapons, {sortAlphabetical: true});
        if (!selection) return;
    }
    await workflowUtils.specialItemUse(selection, Array.from(workflow.targets), workflow.item, {consumeResources: true, consumeUsage: true});
}
export let interdictBoonDissOnslaught = {
    name: 'Interdict Boons: Dis\'s Onslaught',
    aliases: ['Dis\'s Onslaught', 'Interdict Boons: Dis\'s Onslaught (Passive)'],
    version: '1.3.71',
    rules: 'legacy',
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