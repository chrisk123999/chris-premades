import {actorUtils, dialogUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function late({trigger: {entity: item}, workflow}) {
    if (!workflow.hitTargets.size || !workflow.damageRoll) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('lightning')) return;
    let validTargets = Array.from(workflow.hitTargets.filter(i => actorUtils.getSize(i.actor) <= 3));
    if (!validTargets.length) return;
    let selection = await dialogUtils.selectTargetDialog(item.name, 'CHRISPREMADES.Macros.ThunderboltStrike.Select', validTargets, {
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