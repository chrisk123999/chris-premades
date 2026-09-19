import {automationUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function use({document, workflow}) {
    if (workflow.targets.size !== 1 || !workflow.damageTotal) return;
    const range = automationUtils.getConfigValue(document, 'range');
    const targets = tokenUtils.findNearby(workflow.targets.first().document, range, {disposition: 'ally'});
    if (!targets.length) return;
    await workflowUtils.applyDamage(targets, workflow.damageTotal, workflow.defaultDamageType);
}
export const maddeningHex = {
    name: 'Eldritch Invocations: Maddening Hex',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ],
    config: {
        range: {
            default: 5,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'homebrew'
        }
    }
};
