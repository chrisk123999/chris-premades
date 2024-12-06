import {firearm} from '../../mechanics/firearm.js';

export let pepperbox = {
    name: 'Pepperbox (Exandria)',
    version: '1.1.0',
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
            default: '2',
            category: 'mechanics'
        }
    ],
    ddbi: {
        correctedItems: {
            'Pepperbox (Exandria)': {
                system: {
                    uses: {
                        value: 6,
                        max: '6',
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