async function applyDamage({workflow, ditem}) {
    if (workflow.item.type !== 'spell') return;
    if (ditem.oldHP > 0) return;
    if (!workflow.damageRolls.length) return;
    for (let [idx, currRoll] of workflow.damageRolls.entries()) {
        if (currRoll.options.type !== 'healing') continue;
        let diff = currRoll.dice.reduce((acc, i) => acc + i.number * i.faces - i.total, 0);
        if (!diff) continue;
        ditem.rawDamageDetail[idx].value += diff;
        let modifiedDiff = diff * (ditem.damageDetail[idx].active.multiplier ?? 1);
        ditem.damageDetail[idx].value += modifiedDiff;
        ditem.hpDamage += modifiedDiff;
    }
}
export let circleOfMortality = {
    name: 'Circle of Mortality',
    version: '0.12.37',
    midi: {
        actor: [
            {
                pass: 'applyDamage',
                macro: applyDamage,
                priority: 50
            }
        ]
    }
};