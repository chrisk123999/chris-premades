async function skill({trigger: {skillId}}) {
    if (skillId !== 'ste') return;
    return {label: 'CHRISPREMADES.Macros.BootsOfElvenkind.Silent', type: 'advantage'};
}
export let bootsOfElvenkind = {
    name: 'Boots of Elvenkind',
    version: '0.12.70',
    skill: [
        {
            pass: 'context',
            macro: skill,
            priority: 50
        }
    ]
};