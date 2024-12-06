import {firearm} from '../../mechanics/firearm.js';

export let palmPistol = {
    name: 'Palm Pistol (Exandria)',
    version: '1.1.0',
    midi: firearm.midi,
    config: firearm.config,
    ddbi: {
        correctedItems: {
            'Palm Pistol (Exandria)': {
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