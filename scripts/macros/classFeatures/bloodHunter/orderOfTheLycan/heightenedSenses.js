import {genericUtils} from '../../../../utils.js';
async function skill({trigger}) {
    if (trigger.skillId !== 'prc') return;
    let senses = ['Smell', 'Hearing'].map(i => genericUtils.translate('CHRISPREMADES.Macros.KeenSenses.' + i)).join(', ');
    return {label: genericUtils.translate('CHRISPREMADES.Macros.KeenSenses.Check') + senses + '.', type: 'advantage'};
}
export let heightenedSenses = {
    name: 'Heightened Senses',
    version: '0.12.64',
    skill: [
        {
            pass: 'context',
            macro: skill,
            priority: 50
        }
    ],
    ddbi: {
        renamedItems: {
            'Heightened Senses: Hemocraft Modifier: Intelligence': 'Heightened Senses',
            'Heightened Senses: Hemocraft Modifier: Wisdom': 'Heightened Senses'
        },
    }
};