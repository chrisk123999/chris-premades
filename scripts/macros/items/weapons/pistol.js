import {firearm} from '../../mechanics/firearm.js';

export let pistol = {
    name: 'Pistol (Exandria)',
    version: '1.0.12',
    midi: firearm.midi,
    config: firearm.config,
    ddbi: {
        correctedItems: {
            'Pistol (Exandria)': {
                system: {
                    uses: {
                        value: 4,
                        max: '4',
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