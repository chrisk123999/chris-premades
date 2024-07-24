import {Teleport} from '../../lib/teleport.js';

async function use({workflow}) {
    await Teleport.target([workflow.token], workflow.token, {range: 30, animation: 'mistyStep'});
}
export let mistyStep = {
    name: 'Misty Step',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};