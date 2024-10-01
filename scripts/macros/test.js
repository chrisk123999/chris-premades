import {rollUtils} from '../utils.js';
async function use({trigger, workflow}) {
    console.log('--- Used! ---');
}
async function damage({trigger, workflow}) {
    console.log('--- Damage! ---');
}
export let test = {
    name: 'test',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 150
            }
        ]
    }
};
export let test2 = {
    name: 'test2',
    version: '0.12.0',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};