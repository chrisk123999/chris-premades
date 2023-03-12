import {chris} from '../../helperFunctions.js';
export async function beaconOfHope(token, {item, workflow, ditem}) {
    let effect = chris.findEffect(token.actor, 'Beacon of Hope');
    if (!effect) return;
    if (!workflow.damageRoll) return;
    let oldHealingTotal = 0;
    let newHealingTotal = 0;
    for (let i = 0; workflow.damageRoll.terms.length > i; i++) {
        let flavor = workflow.damageRoll.terms[i].flavor;
        let isDeterministic = workflow.damageRoll.terms[i].isDeterministic;
        if (flavor.toLowerCase() === 'healing' && !isDeterministic) {
            oldHealingTotal += workflow.damageRoll.terms[i].total;
            newHealingTotal += workflow.damageRoll.terms[i].faces;
        } else {
            if (!isNaN(workflow.damageRoll.terms[i].total)) {
                oldHealingTotal += workflow.damageRoll.terms[i].total;
                newHealingTotal += workflow.damageRoll.terms[i].total;
            }
        }
    }
    let healingDifference = newHealingTotal - oldHealingTotal;
    if (healingDifference === 0) return;
    ditem.hpDamage -= healingDifference;
    ditem.newHP += healingDifference;
}