import {itemUtils, tokenUtils} from '../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.failedSaves.size) return;
    let distance = Number(itemUtils.getConfig(workflow.item, 'distance'));
    await Promise.all(workflow.failedSaves.map(async i => await tokenUtils.pushToken(workflow.token, i, distance)));
}
export let thunderwave = {
    name: 'Thunderwave',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'distance',
            label: 'CHRISPREMADES.Generic.Distance',
            type: 'text',
            default: 10,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};