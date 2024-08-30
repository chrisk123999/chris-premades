import { attack } from './manifestEcho.js';
export let unleashIncarnation = {
    name: 'Unleash Incarnation',
    version: '0.12.46',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: attack,
                priority: 50
            }
        ]
    }
};