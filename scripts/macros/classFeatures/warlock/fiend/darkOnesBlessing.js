import {chris} from '../../../../helperFunctions.js';
export async function darkOnesBlessing({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size === 0 || !workflow.damageList) return;
    let doHealing = false;
    for (let i of workflow.damageList) {
        if (i.oldHP != 0 && i.newHP === 0) {
            doHealing = true;
            break;
        }
    }
    if (!doHealing) return;
    let effect = chris.findEffect(workflow.actor, 'Dark One\'s Blessing');
    if (!effect) return;
    let originItem = await effect.parent;
    await originItem.use();
}