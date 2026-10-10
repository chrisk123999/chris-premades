import {automationUtils, workflowUtils} from '../../../proxy.mjs';
async function attacked({document, workflow}) {
    const formula = automationUtils.getOriginConfigValue(document, 'formula') ?? bladeWard.config.formula.default;
    workflowUtils.addAttackRollPart(workflow, '-(' + formula + ')');
}
export const bladeWard = {
    name: 'Blade Ward',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {
            pass: 'targetAttackRollConfig',
            macro: attacked,
            priority: 50
        }
    ],
    config: {
        formula: {
            default: '1d4',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'homebrew'
        }
    }
};
