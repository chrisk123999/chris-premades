async function skill({trigger: {skillId}}) {
    if (skillId !== 'inv') return;
    return {label: 'CHRISPREMADES.Macros.EyesOfMinuteSeeing.Close', type: 'advantage'};
}
export let eyesOfMinuteSeeing = {
    name: 'Eyes of Minute Seeing',
    version: '0.12.70',
    skill: [
        {
            pass: 'context',
            macro: skill,
            priority: 50
        }
    ]
};