import {dialogUtils, genericUtils, itemUtils, tokenUtils} from '../../../../utils.js';

async function late({trigger: {entity: item}, workflow}) {
    if (genericUtils.getIdentifier(workflow.item) !== 'eldritchBlastBeam') return;
    if (!workflow.hitTargets.size) return;
    let targetToken = workflow.targets.first();
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseOn', {itemName: item.name, tokenName: targetToken.name}));
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