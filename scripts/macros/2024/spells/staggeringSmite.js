import {constants} from '../../../utils.js';
import {divineSmite} from './divineSmite.js';
export let staggeringSmite = {
    name: 'Staggering Smite',
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
            default: 'psychic',
            category: 'homebrew',
            homebrew: true,
            options: constants.damageTypeOptions
        },
        {
            value: 'diceSize',
            label: 'CHRISPREMADES.Config.DiceSize',
            type: 'select',
            default: 'd6',
            options: constants.diceSizeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'baseDiceNumber',
            label: 'CHRISPREMADES.Config.BaseDiceNumber',
            type: 'text',
            default: 4,
            category: 'homebrew',
            homebrew: true
        }
    ]
};