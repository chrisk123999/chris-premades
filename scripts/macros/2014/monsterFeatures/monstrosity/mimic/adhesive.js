import {itemUtils, tokenUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size || !workflow.token) return;
    let dc = Number(itemUtils.getConfig(workflow.item, 'dc'));
    if (isNaN(dc)) return;
    await Promise.all(workflow.targets.map(async token => {
        await tokenUtils.grappleHelper(workflow.token, token, workflow.item, {noContest: true, flatDC: dc, escapeDisadvantage: true});
    }));
}
export let mimicAdhesive = {
    name: 'Adhesive (Object Form Only)',
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
            value: 'dc',
            label: 'CHRISPREMADES.Config.DC',
            type: 'text',
            default: 13,
            category: 'mechanics'
        }
    ],
    monster: [
        'Mimic',
        'Dune Mimic',
        'Spitting Mimic'
    ]
};