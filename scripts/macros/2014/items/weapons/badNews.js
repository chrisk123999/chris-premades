import {firearm} from '../../mechanics/firearm.js';

export let badNews = {
    name: 'Bad News (Exandria)',
    version: '1.1.10',
    midi: firearm.midi,
    config: [
        {
            value: 'status',
            label: 'CHRISPREMADES.Firearm.Status',
            type: 'select',
            options: [
                {
                    value: 0,
                    label: 'CHRISPREMADES.Firearm.Undamaged'
                },
                {
                    value: 1,
                    label: 'CHRISPREMADES.Firearm.Damaged'
                },
                {
                    value: 2,
                    label: 'CHRISPREMADES.Firearm.Broken'
                },
            ],
            default: 0,
            category: 'mechanics'
        },
        {
            value: 'misfire',
            label: 'CHRISPREMADES.Firearm.MisfireScore',
            type: 'text',
            default: '3',
            category: 'mechanics'
        }
    ],
    ddbi: {
        correctedItems: {
            'Bad News (Exandria)': {
                system: {
                    uses: {
                        value: 1,
                        max: '1',
                        per: 'charges',
                        prompt: false,
                        recovery: ''
                    },
                    consume: {
                        amount: 0,
                        type: 'ammo'
                    }
                }
            }
        }
    }
};