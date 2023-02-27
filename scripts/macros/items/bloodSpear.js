import {chris} from '../../helperFunctions.js';
export async function bloodSpear(workflow) {
    if (workflow.hitTargets.size != 1) return;
    let newHP = workflow.damageList[0].newHP;
    if (newHP != 0) return;
    let oldHP = workflow.damageList[0].oldHP;
    if (newHP === oldHP) return;
    let damageRoll = await new Roll('2d6[temphp]').roll({async: true});
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: workflow.item.name
    });
    await chris.applyDamage(workflow.token, damageRoll.total, 'healing');
}