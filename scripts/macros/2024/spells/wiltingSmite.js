import {constants} from '../../../utils.js';
import {divineSmite} from './divineSmite.js';
export let wiltingSmite = {
    name: 'Wilting Smite',
    version: '1.1.14',
    rules: 'modern',
    midi: {
        actor: divineSmite.midi.actor
    },
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'necrotic',
            category: 'homebrew',
            homebrew: true,
            options: constants.damageTypeOptions
        },
        {
            value: 'baseDiceNumber',
            label: 'CHRISPREMADES.Config.BaseDiceNumber',
            type: 'number',
            default: 2,
            category: 'homebrew',
            homebrew: true
        }
    ]
};