import {upcastTargets} from '../../generic/upcastTargets.js';
export let bane = {
    name: 'Bane',
    version: '1.1.13',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: upcastTargets.plusThree,
                priority: 50
            }
        ]
    }
};