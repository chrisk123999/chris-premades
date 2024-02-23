import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
import {translate} from '../../translations.js';
export async function beaconOfHope(token, {item, workflow, ditem}) {
    let effect = chris.findEffect(token.actor, 'Beacon of Hope');
    if (!effect) return;
    if (!workflow.damageRoll) return;
    let defaultDamageType = workflow.defaultDamageType;
    if (defaultDamageType != translate.healingType('healing')) return;
    if (chris.checkTrait(token.actor, 'di', 'healing')) return;
    let newHealingTotal = 0;
    let queueSetup = await queue.setup(workflow.uuid, 'beaconOfHope', 351);
    if (!queueSetup) return;
    for (let i = 0; workflow.damageRoll.terms.length > i; i++) {
        let flavor = workflow.damageRoll.terms[i].flavor;
        let isDeterministic = workflow.damageRoll.terms[i].isDeterministic;
        if (flavor.toLowerCase() === translate.healingType('healing') && !isDeterministic) {
            newHealingTotal += workflow.damageRoll.terms[i].faces * workflow.damageRoll.terms[i].results.length;
        } else {
            if (!isNaN(workflow.damageRoll.terms[i].total)) {
                newHealingTotal += workflow.damageRoll.terms[i].total;
            }
        }
    }
    if (chris.checkTrait(token.actor, 'dr', translate.healingType('healing'))) newHealingTotal = Math.floor(newHealingTotal / 2);
    let maxHP = token.actor.system.attributes.hp.max;
    ditem.hpDamage = -Math.clamped(newHealingTotal, 0, maxHP - ditem.oldHP);
    ditem.newHP = Math.clamped(ditem.oldHP + newHealingTotal, 0, maxHP);
    ditem.totalDamage = newHealingTotal;
    queue.remove(workflow.uuid);
}