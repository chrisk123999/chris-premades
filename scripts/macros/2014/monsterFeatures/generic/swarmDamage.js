async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    let {value: hp, max} = workflow.actor.system.attributes.hp;
    if (hp > Math.floor(max / 2)) return;
    let damageFormula = workflow.activity.damage.parts[0].formula;
    let numDice = Number(damageFormula.split('d')[0]);
    if (!numDice) return;
    numDice = Math.floor(numDice / 2);
    let newFormula = [numDice, ...damageFormula.split('d').slice(1)].join('d');
    let damageRolls = workflow.damageRolls.slice(1);
    let newRoll = await new CONFIG.Dice.DamageRoll(newFormula, workflow.item.getRollData(), {type: workflow.activity.damage.parts[0].types.first()}).evaluate();
    damageRolls.unshift(newRoll);
    await workflow.setDamageRolls(damageRolls);
}
export let swarmDamage = {
    name: 'Swarm Damage',
    translation: 'CHRISPREMADES.Macros.SwarmDamage.Name',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: []
};