import {dialogUtils, tokenUtils} from '../../utils.js';

async function use({workflow}) {
    if (!workflow.failedSaves.size) return;
    let targetToken = await workflow.targets.first();
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Telekinetic.Select', [
        ['CHRISPREMADES.Direction.Towards', -5],
        ['CHRISPREMADES.Direction.Away', 5] 
    ]);
    if (!selection) return;
    await tokenUtils.pushToken(workflow.token, targetToken, selection);
}
export let telekineticShove = {
    name: 'Telekinetic: Shove',
    version: '0.12.70',
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