import {rollUtils} from '../utils.js';
async function bonus({trigger}) {
    if (trigger.saveId != 'dex') return;
    return await rollUtils.addToRoll(trigger.roll, '1d4', {rollData: trigger.actor.getRollData()});
}
async function context({trigger}) {
    return {label: 'This is a test!', type: 'advantage'};
}
async function situational({trigger}) {
    if (trigger.saveId != 'dex') return;
    trigger.options.advantage = true;
}
export let test = {
    name: 'test',
    version: '0.12.0',
    save: [
        {
            pass: 'bonus',
            macro: bonus,
            priority: 50
        },
        {
            pass: 'context',
            macro: context,
            priority: 50
        },
        {
            pass: 'situational',
            macro: situational,
            priority: 50
        }
    ]
};