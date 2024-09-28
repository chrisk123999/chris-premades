import {itemUtils} from '../../../utils.js';
import {grappleHelper} from '../../actions/grapple.js';

async function late({trigger: {entity: item}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    let config = itemUtils.getGenericFeatureConfig(item, 'autoGrapple');
    await grappleHelper(workflow.token, workflow.hitTargets.first(), item, {noContest: true, flatDC: config.dc, escapeDisadvantage: config.disadvantage});
}
export let autoGrapple = {
    name: 'Auto Grapple',
    translation: 'CHRISPREMADES.Macros.AutoGrapple.Name',
    version: '0.12.83',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'dc',
            label: 'CHRISPREMADES.Macros.AutoGrapple.DC',
            type: 'number',
            default: 13
        },
        {
            value: 'disadvantage',
            label: 'CHRISPREMADES.Macros.AutoGrapple.Disadvantage',
            type: 'checkbox',
            default: true
        }
    ]
};