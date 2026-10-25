async function sendExtraRageEffects({document: item}) {
    return Array.from(item.system.activities);
}
async function attack({document: effect, macroClass: {identifier, source}, workflow}) {
    const target = workflow.targets.first()?.document;
    if (!target || target.actor.uuid === effect.actor.uuid) return;
    if (target.actor.flags[source]?.wildHeart?.['rage-lion']) return;
    workflow.tracker.disadvantage.add(identifier, effect.flags[source]?.lion?.name ?? effect.name);
}
export const powerOfTheWilds = {
    name: 'Power of the Wilds',
    version: '2.1.4',
    rules: '2024',
    called: [
        {
            pass: 'actorPowerOfTheWilds',
            macro: sendExtraRageEffects,
            priority: 200
        }
    ]
};
export const lionAttack = {
    version: powerOfTheWilds.version,
    rules: powerOfTheWilds.rules, 
    roll: [
        {
            pass: 'nearbyAttackRollConfig',
            macro: attack,
            priority: 500,
            dispositions: ['enemy'],
            distance: 5
        }
    ]
};
