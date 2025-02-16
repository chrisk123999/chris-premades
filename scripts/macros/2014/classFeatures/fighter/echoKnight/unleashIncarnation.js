import { attack } from './manifestEcho.js';
export let unleashIncarnation = {
    name: 'Unleash Incarnation',
    version: '1.1.0',
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