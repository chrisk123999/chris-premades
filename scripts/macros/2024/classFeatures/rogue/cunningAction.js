import {dash} from '../../actions/dash.js';
import {disengage} from '../../actions/disengage.js';
import {hide} from '../../actions/hide.js';
export let cunningAction = {
    name: 'Cunning Action',
    version: '1.3.34',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: dash.midi.item[0].macro,
                priority: 50,
                activities: ['dash']
            },
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