import {automationUtils, tokenUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    if (!workflow.token) return;
    const {animation} = automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'teleport'});
    const range = automationUtils.getGenericConfigValue(document, 'chris-premades', 'teleport', 'range') || workflow.activity.range.value;
    await tokenUtils.teleportToken(workflow.token.document, {animation, range});
}
export const teleport = {
    rules: 'all',
    version: '2.0.0',
    category: 'movement',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        }
    ],
    genericConfig: {
        range: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.RangeHint'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'mistyStep'
            },
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            category: 'animation',
            label: 'CHRISPREMADES.Config.Animation'
        }
    }
};
