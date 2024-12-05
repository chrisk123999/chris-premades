import {activityUtils, dialogUtils, genericUtils, itemUtils, tokenUtils} from '../../../../utils.js';

async function late({trigger: {entity: item}, workflow}) {
    if (activityUtils.getIdentifier(workflow.activity) !== 'eldritchBlastBeam') return;
    if (!workflow.hitTargets.size) return;
    let targetToken = workflow.targets.first();
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseOn', {itemName: item.name, tokenName: targetToken.name}));
    if (!selection) return;
    await item.use();
    await tokenUtils.pushToken(workflow.token, targetToken, 10);
}
export let repellingBlast = {
    name: 'Eldritch Invocations: Repelling Blast',
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