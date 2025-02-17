import {workflowUtils} from '../../../../utils.js';

async function late({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    let ditem = workflow.damageList[0];
    if (ditem.newHP || !ditem.oldHP) return;
    let damageRoll = await new Roll('2d6[temphp]').evaluate();
    // let damageRoll = await new CONFIG.Dice.DamageRoll('2d6[temphp]', {}, {type: 'temphp'}).evaluate();
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
        flavor: workflow.item.name
    });
    await workflowUtils.applyDamage([workflow.token], damageRoll.total, 'temphp');
}
export let bloodSpear = {
    name: 'Blood Spear',
    version: '1.1.10',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};