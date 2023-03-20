import {chris} from '../../../../helperFunctions.js';
export async function circleOfMortality({speaker, actor, token, character, item, args}) {
    if (this.targets.size === 0 || !this.damageRoll) return;
    for (let i of this.damageList) {
        if (i.oldHP != 0) continue;
        let targetActor = game.scenes.get(i.sceneId).tokens.get(i.tokenId).actor;
        if (chris.checkTrait(targetActor, 'di', 'healing')) continue;
        let newHealingTotal = 0;
        for (let i = 0; this.damageRoll.terms.length > i; i++) {
            let flavor = this.damageRoll.terms[i].flavor;
            let isDeterministic = this.damageRoll.terms[i].isDeterministic;
            if (flavor.toLowerCase() === 'healing' && !isDeterministic) {
                newHealingTotal += this.damageRoll.terms[i].faces * this.damageRoll.terms[i].results.length;
            } else {
                if (!isNaN(this.damageRoll.terms[i].total)) {
                    newHealingTotal += this.damageRoll.terms[i].total;
                }
            }
        }
        if (chris.checkTrait(targetActor, 'dr', 'healing')) newHealingTotal = Math.floor(newHealingTotal / 2);
        let maxHP = targetActor.system.attributes.hp.max;
        i.hpDamage = -Math.clamped(newHealingTotal, 0, maxHP - i.oldHP);
        i.newHP = Math.clamped(i.oldHP + newHealingTotal, 0, maxHP);
        i.totalDamage = newHealingTotal;
    }
}