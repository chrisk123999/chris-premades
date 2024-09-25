import {upcastTargets} from '../generic/upcastTargets.js';

export let bless = {
    name: 'Bless',
    version: '0.12.78',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: upcastTargets.plusOne,
                priority: 50
            }
        ]
    }
};