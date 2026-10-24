async function context({config}) {
    if (config.ability !== 'str') return;
    return {label: 'CHRISPREMADES.Macros.Legacy.AspectBeastBear', type: 'advantage'};
}
export const bearAspect = {
    name: 'Aspect of the Beast: Bear',
    version: '2.1.4',
    rules: '2014',
    check: [
        {
            pass: 'actorContext',
            macro: context,
            priority: 250
        }
    ],
    skill: [
        {
            pass: 'actorContext',
            macro: context,
            priority: 250
        }
    ]
};
