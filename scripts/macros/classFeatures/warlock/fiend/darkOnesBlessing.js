import {chris} from '../../../../helperFunctions.js';
export async function darkOnesBlessing({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.length === 0) return;
    let doHealing = false;
    for (let i of this.damageList) {
        if (i.oldHP != 0 && i.newHP === 0) {
            doHealing = true;
            break;
        }
    }
    if (!doHealing) return;
    let effect = chris.findEffect(this.actor, 'Dark One\'s Blessing');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    await originItem.use();
}