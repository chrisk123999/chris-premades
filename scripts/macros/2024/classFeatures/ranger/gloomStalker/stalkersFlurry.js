import {constants} from '../../../../../utils.js';
export let stalkersFlurry = {
    name: 'Stalker\'s Flurry',
    version: '1.3.81',
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '2d8',
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'psychic',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'range',
            label: 'CHRISPREMADES.Config.Range',
            type: 'number',
            default: 10,
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'includeSelf',
            label: 'CHRISPREMADES.Macros.StalkersFlurry.IncludeSelf',
            type: 'checkbox',
            default: true,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};