import {constants} from '../../../utils.js';
import {divineSmite} from './divineSmite.js';
export let shiningSmite = {
    name: 'Shining Smite',
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
            default: 'radiant',
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
            default: 2,
            category: 'homebrew',
            homebrew: true
        }
    ]
};