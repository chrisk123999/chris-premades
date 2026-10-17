import {automationUtils, workflowUtils} from '../../../proxy.mjs';
async function drain({workflow}) {
    if (workflow.activity.identifier !== 'vampiric-touch-attack' || !workflow.hitTargets.size || !workflow.token) return;
    const dealt = workflowUtils.getDamageDealt(workflow);
    const healing = Math.floor(dealt * Number(automationUtils.getConfigValue(workflow.item, 'healingModifier') ?? 0.5));
    if (healing > 0) await workflowUtils.applyDamage([workflow.token.document], healing, 'healing');
}
export const vampiricTouch = {
    name: 'Vampiric Touch',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {pass: 'itemRollFinished', macro: drain, priority: 60}
    ],
    config: {
        healingModifier: {
            default: 0.5,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.VampiricTouch.HealingMultiplier',
            category: 'homebrew'
        }
    }
};
