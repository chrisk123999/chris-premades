import {upcastTargets} from '../../generic/upcastTargets.js';
export let bless = {
    name: 'Bless',
    version: '1.1.0',
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