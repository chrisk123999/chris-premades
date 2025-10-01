import {constants} from '../../../../../utils.js';

export let lunarForm = {
    name: 'Lunar Form',
    version: '1.3.83',
    rules: 'modern',
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '2d10',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'radiant',
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};