import {dialogUtils, genericUtils, itemUtils, tokenUtils} from '../../../../utils.js';

async function late({workflow}) {
    if (genericUtils.getIdentifier(workflow.item) !== 'eldritchBlast') return;
    if (!workflow.hitTargets.size) return;
    let originItem = itemUtils.getItemByIdentifier(workflow.actor, 'repellingBlast');
    if (!originItem) return;
    let selection = await dialogUtils.confirm(originItem.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: originItem.name}));
    if (!selection) return;
    let targets;
    if (workflow.hitTargets.size > 1) {
        selection = await dialogUtils.selectTargetDialog(originItem.name, 'CHRISPREMADES.Macros.ThunderboltStrike.Select', Array.from(workflow.hitTargets), {
            type: 'multiple',
            maxAmount: workflow.hitTargets.size
        });
        if (!selection?.length) return;
        targets = selection[0];
    } else {
        targets = [workflow.hitTargets.first()];
    }
    if (!targets.length) return;
    for (let i of targets) await tokenUtils.pushToken(workflow.token, i, 10);
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