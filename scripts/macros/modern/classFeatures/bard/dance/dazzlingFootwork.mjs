async function danceVirtuoso({actor, skillId}) {
    if (skillId !== 'prf') return;
    const ac = actor.system.attributes.ac;
    if (ac.equippedShield || ['light', 'medium', 'heavy'].includes(ac.equippedArmor?.system.type.value)) return;
    return {label: 'CHRISPREMADES.Macros.Modern.DanceVirtuoso', type: 'advantage'};
}
export const dazzlingFootwork = {
    name: 'Dazzling Footwork',
    version: '2.1.7',
    rules: '2024',
    skill: [
        {
            pass: 'actorContext',
            macro: danceVirtuoso,
            priority: 200
        }
    ]
};
