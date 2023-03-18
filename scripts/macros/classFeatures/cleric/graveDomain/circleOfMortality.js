export async function circleOfMortality(workflow) {
    if (workflow.targets.size === 0 || !workflow.damageRoll) return;
    for (let i of workflow.damageList) {
        if (i.oldHP != 0) continue;
        let oldHealingTotal = 0;
        let newHealingTotal = 0;
        for (let i = 0; workflow.damageRoll.terms.length > i; i++) {
            let flavor = workflow.damageRoll.terms[i].flavor;
            let isDeterministic = workflow.damageRoll.terms[i].isDeterministic;
            if (flavor.toLowerCase() === 'healing' && !isDeterministic) {
                oldHealingTotal += workflow.damageRoll.terms[i].total;
                newHealingTotal += workflow.damageRoll.terms[i].faces * workflow.damageRoll.terms[i].results.length;
            } else {
                if (!isNaN(workflow.damageRoll.terms[i].total)) {
                    oldHealingTotal += workflow.damageRoll.terms[i].total;
                    newHealingTotal += workflow.damageRoll.terms[i].total;
                }
            }
        }
        let healingDifference = newHealingTotal - oldHealingTotal;
        if (healingDifference === 0) return;
        i.hpDamage -= healingDifference;
        i.newHP += healingDifference;
        i.totalDamage = newHealingTotal;
    }
}