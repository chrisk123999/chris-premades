import {disengage} from '../../actions/disengage.js';
import {hide} from '../../actions/hide.js';
export let goblinWarriorNimbleEscape = {
    name: 'Nimble Escape',
    version: '1.3.130',
    rules: 'modern',
    monsters: [
        'Goblin Warrior',
        'Goblin Boss'
    ],
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: disengage.midi.item[0].macro,
                priority: 50,
                activities: ['disengage']
            },
            {
                pass: 'rollFinished',
                macro: hide.midi.item[0].macro,
                priority: 50,
                activities: ['hide']
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'displayHint',
            label: 'CHRISPREMADES.Config.DisplayHint',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ],
    hasAnimation: true
};