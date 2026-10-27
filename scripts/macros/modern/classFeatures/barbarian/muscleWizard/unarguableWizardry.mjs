async function context({skillId}) {
    if (skillId !== 'itm') return;
    return {label: 'CHRISPREMADES.Macros.Modern.UnarguableWizardry.Prompt', type: 'advantage'};
}
export const unarguableWizardry = {
    name: 'Unarguable Wizardry',
    version: '2.1.4',
    rules: '2024',
    skill: [
        {
            pass: 'actorContext',
            macro: context,
            priority: 50
        }
    ]
};
