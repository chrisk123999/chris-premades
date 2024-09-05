import {dialogUtils, genericUtils, itemUtils, tokenUtils} from '../../../../utils.js';

async function late({workflow}) {
    if (genericUtils.getIdentifier(workflow.item) !== 'eldritchBlastBeam') return;
    if (!workflow.hitTargets.size) return;
    let originItem = itemUtils.getItemByIdentifier(workflow.actor, 'repellingBlast');
    if (!originItem) return;
    let targetToken = workflow.targets.first();
    let selection = await dialogUtils.confirm(originItem.name, genericUtils.format('CHRISPREMADES.Dialog.UseOn', {itemName: originItem.name, tokenName: targetToken.name}));
    if (!selection) return;
    await tokenUtils.pushToken(workflow.token, targetToken, 10);
}
export let repellingBlast = {
    name: 'Eldritch Invocations: Repelling Blast',
    version: '0.12.54',
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