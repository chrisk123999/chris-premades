import {genericUtils, itemUtils} from '../../../utils.js';
async function skill({trigger}) {
    if (trigger.skillId != 'prc') return;
    let item = itemUtils.getItemByGenericFeature(trigger.actor, 'keenSenses');
    if (!item) return;
    let config = itemUtils.getGenericFeatureConfig(item, 'keenSenses');
    if (!config) return;
    let senses = Object.entries(config).reduce((senses, [key, value]) => {
        if (value) senses += (senses.length ? ', ' : '') + genericUtils.translate('CHRISPREMADES.Macros.KeenSenses.' + key.capitalize());
        return senses;
    }, '');
    if (!senses.length) return;
    return {label: genericUtils.translate('CHRISPREMADES.Macros.KeenSenses.Check') + senses + '.', type: 'advantage'};
}
export let keenSenses = {
    name: 'Keen Senses',
    translation: 'CHRISPREMADES.Macros.KeenSenses.Name',
    version: '0.12.0',
    skill: [
        {
            pass: 'context',
            macro: skill,
            priority: 50
        }
    ],
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'hearing',
            label: 'CHRISPREMADES.Macros.KeenSenses.Hearing',
            type: 'checkbox',
            default: false,
        },
        {
            value: 'sight',
            label: 'CHRISPREMADES.Macros.KeenSenses.Sight',
            type: 'checkbox',
            default: false,
        },
        {
            value: 'smell',
            label: 'CHRISPREMADES.Macros.KeenSenses.Smell',
            type: 'checkbox',
            default: false,
        }
    ]
};