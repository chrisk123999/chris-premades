async function skill({trigger: {skillId}}) {
    if (skillId !== 'itm') return;
    return {label: 'CHRISPREMADES.Macros.UnarguableWizardry.Prompt', type: 'advantage'};
}
export let unarguableWizardry = {
    name: 'Unarguable Wizardry',
    version: '1.3.91',
    rules: 'modern',
    skill: [
        {
            pass: 'context',
            macro: skill,
            priority: 50
        }
    ]
};