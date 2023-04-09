import {chris} from '../../../../helperFunctions.js';
export async function maddeningHex({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let targets = chris.findNearby(this.targets.first(), 5, 'ally');
    if (targets.length === 0) return;
    await chris.applyDamage(targets, this.damageTotal, this.defaultDamageType);
}