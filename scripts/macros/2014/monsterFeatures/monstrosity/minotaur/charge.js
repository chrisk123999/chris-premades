import {itemUtils, tokenUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.token) return;
    let distance = Number(itemUtils.getConfig(workflow.item, 'distance'));
    if (isNaN(distance)) return;
    await Promise.all(workflow.failedSaves.map(async token => {
        await tokenUtils.pushToken(workflow.token, token, 10);
    }));
}
export let minotaurCharge = {
    name: 'Charge',
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
            label: 'CHRISPREMADES.Config.Distance',
            type: 'text',
            default: 10,
            category: 'mechanics'
        }
    ],
    monster: [
        'Minotaur'
    ]
};