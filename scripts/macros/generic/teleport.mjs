import {automationUtils, tokenUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    if (!workflow.token) return;
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'teleport', configKeys);
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'teleport'});
    const rolledRange = config.rangeFromRoll ? workflow.utilityRolls?.[0]?.total : undefined;
    const range = rolledRange || config.range || workflow.activity.range.value;
    await tokenUtils.teleportToken(workflow.token.document, {animation, options, range});
}
export const teleport = {
    rules: 'all',
    version: '2.1.0',
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
        rangeFromRoll: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Teleport.RangeFromRoll',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.RangeFromRollHint'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'mistyStep'
            },
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            category: 'animations',
            label: 'CHRISPREMADES.Config.Animation'
        }
    }
};
const configKeys = Object.keys(teleport.genericConfig);
