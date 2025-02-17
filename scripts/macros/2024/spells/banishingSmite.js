import {constants} from '../../../utils.js';
import {divineSmite} from './divineSmite.js';
async function veryEarly({dialog}) {
    dialog.configure = false;
}
export let banishingSmite = {
    name: 'Banishing Smite',
    version: '1.1.14',
    rules: 'modern',
    midi: {
        actor: divineSmite.midi.actor,
        item: [
            {
                pass: 'preTargeting',
                macro: veryEarly,
                priority: 50,
                activities: ['banish']
            }
        ]
    },
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'force',
            category: 'homebrew',
            homebrew: true,
            options: constants.damageTypeOptions
        },
        {
            value: 'diceSize',
            label: 'CHRISPREMADES.Config.DiceSize',
            type: 'select',
            default: 'd10',
            options: constants.diceSizeOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'baseDiceNumber',
            label: 'CHRISPREMADES.Config.BaseDiceNumber',
            type: 'number',
            default: 5,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'hp',
            label: 'CHRISPREMADES.Macros.BanishingSmite.Hp',
            type: 'number',
            default: 50,
            category: 'homebrew',
            homebrew: true
        }
    ]
};