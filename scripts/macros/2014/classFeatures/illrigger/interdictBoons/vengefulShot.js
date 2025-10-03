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
async function added({trigger: {entity: item}}) {
    await itemUtils.multiCorrectActivityItemConsumption(item, ['use'], {
        0: 'balefulInterdict',
        1: 'interdictBoons'
    });
}
export let interdictBoonVengefulShot = {
    name: 'Interdict Boons: Vengeful Shot',
    aliases: ['Vengeful Shot'],
    version: '1.7.77',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 50
        }
    ]
};