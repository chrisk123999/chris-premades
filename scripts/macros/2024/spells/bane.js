import {upcastTargets} from '../../generic/upcastTargets.js';
export let bane = {
    name: 'Bane',
    version: '1.1.13',
    rules: 'modern',
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