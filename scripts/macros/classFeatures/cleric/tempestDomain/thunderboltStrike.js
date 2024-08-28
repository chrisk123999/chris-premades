import {actorUtils, dialogUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function late({workflow}) {
    if (!workflow.hitTargets.size || !workflow.damageRoll) return;
    let originItem = itemUtils.getItemByIdentifier(workflow.actor, 'thunderboltStrike');
    if (!originItem) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('lightning')) return;
    let validTargets = Array.from(workflow.hitTargets.filter(i => actorUtils.getSize(i.actor) <= 3));
    if (!validTargets.length) return;
    let selection = await dialogUtils.selectTargetDialog(originItem.name, 'CHRISPREMADES.Macros.ThunderboltStrike.Select', validTargets, {
        type: 'multiple',
        maxAmount: validTargets.length
    });
    if (!selection?.length) return;
    let targets = selection[0];
    if (!targets.length) return;
    for (let i of targets) await tokenUtils.pushToken(workflow.token, i, 10);
}
export let thunderboltStrike = {
    name: 'Thunderbolt Strike',
    version: '0.12.40',
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