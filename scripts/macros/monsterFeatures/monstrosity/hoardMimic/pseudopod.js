import {dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
import {grappleHelper} from '../../../actions/grapple.js';
async function use({trigger, workflow}) {
    if (!workflow.hitTargets.size || !workflow.token) return;
    let dc = Number(itemUtils.getConfig(workflow.item, 'dc'));
    if (isNaN(dc)) return;
    await Promise.all(workflow.hitTargets.map(async token => {
        await grappleHelper(workflow.token, token, workflow.item, {noContest: true, flatDC: dc, escapeDisadvantage: true});
    }));
}
export let hoardMimicPseudopod = {
    name: 'Pseudopod',
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
            default: 16,
            category: 'mechanics'
        }
    ],
    monster: [
        'Hoard Mimic'
    ]
};