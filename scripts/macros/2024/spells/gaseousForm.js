import {upcastTargets} from '../../generic/upcastTargets.js';
export let gaseousForm = {
    version: '1.2.24',
    rules: 'modern',
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