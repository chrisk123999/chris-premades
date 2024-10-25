import {dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.hitTargets.size) return;
    let adhesive = itemUtils.getItemByIdentifier(workflow.actor, 'mimicAdhesive');
    if (!adhesive) return;
    let selection = await dialogUtils.confirm(adhesive.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: adhesive.name}));
    if (!selection) return;
    await Promise.all(workflow.hitTargets.map(async token => {
        await workflowUtils.syntheticItemRoll(adhesive, [token]);
    }));
}
export let mimicPseudopod = {
    name: 'Pseudopod',
    version: '1.0.29',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    monster: [
        'Mimic',
        'Dune Mimic',
        'Spitting Mimic'
    ]
};