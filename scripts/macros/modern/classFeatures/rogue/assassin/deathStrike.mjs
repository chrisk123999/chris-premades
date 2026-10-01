import {automationUtils, itemUtils, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
async function useSave({document: item, data: {workflow, targetToken}}) {
    if (workflow.token?.document.combatant?.combat.round !== 1) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'death-strike');
    if (!activity) return;
    const saveWorkflow = await workflowUtils.syntheticActivityRoll(activity, [targetToken]);
    if (!saveWorkflow?.failedSaves.size) return;
    workflowUtils.setWorkflowProperty(workflow, 'deathStrike', true);
}
async function double({document: item, workflow}) {
    if (!workflowUtils.getWorkflowProperty(workflow, 'deathStrike')) return;
    const multiplier = automationUtils.getConfigValue(item, 'multiplier');
    const damageRolls = await Promise.all(workflow.damageRolls.map(roll => rollUtils.addToRoll(roll, roll.total * (multiplier - 1))));
    await workflow.setDamageRolls(damageRolls);
}
export const deathStrike = {
    name: 'Death Strike',
    version: '2.0.0',
    rules: '2024',
    called: [
        {
            pass: 'actorSneakAttackUsed',
            macro: useSave,
            priority: 50
        }
    ],
    roll: [
        {
            pass: 'actorDamageRollComplete',
            macro: double,
            priority: 200
        }
    ],
    config: {
        multiplier: {
            default: 2,
            type: 'number',
            label: 'CHRISPREMADES.Config.Multiplier',
            category: 'homebrew'
        }
    }
};
