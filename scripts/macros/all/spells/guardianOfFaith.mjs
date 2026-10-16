import {summonUtils, workflowUtils} from '../../../proxy.mjs';
async function damage({document, workflow}) {
    if (workflow.activity.identifier === 'guardian-of-faith-cost') return;
    const dealt = Math.floor(workflowUtils.getDamageDealt(workflow));
    const remaining = document.system.uses.value ?? 0;
    const spent = Math.min(dealt, remaining);
    if (spent > 0) await workflowUtils.spendScaledCost(document, 'guardian-of-faith-cost', spent);
    if (remaining - spent > 0) return;
    const summon = summonUtils.getSummonData(document.actor);
    if (summon) await summonUtils.deleteSummon(summon);
}
export const guardianOfFaith = {
    name: 'Guardian of Faith',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {pass: 'itemRollFinished', macro: damage, priority: 50}
    ]
};
