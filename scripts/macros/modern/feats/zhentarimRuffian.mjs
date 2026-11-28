import {automationUtils, dialogUtils, documentUtils, queryUtils, workflowUtils} from '../../../proxy.mjs';
function count({workflow}) {
    if (!workflow.workflowOptions?.['gambits-premades']?.opportunityAttack) return;
    workflowUtils.setWorkflowProperty(workflow, 'exploitOpeningRolls', workflow.damageRolls?.length ?? 0);
}
async function damage({document: item, workflow}) {
    const rollCount = workflowUtils.getWorkflowProperty(workflow, 'exploitOpeningRolls');
    if (!rollCount || !workflow.workflowOptions?.['gambits-premades']?.opportunityAttack) return;
    await workflowUtils.rerollKeepDamage(workflow, item, {keep: automationUtils.getConfigValue(item, 'keep'), count: rollCount});
}
async function preInitiative({document: activity, actor, token, combat}) {
    if (actor.type !== 'character' || !actor.system.attributes.inspiration) return;
    if (!await dialogUtils.confirmUseItem(activity.item, {userId: queryUtils.firstOwner(actor, true)})) return;
    const allies = combat.combatants.filter(combatant => combatant.token && combatant.actor && combatant.actor !== actor && combatant.initiative === null && combatant.token.disposition === token.disposition).map(combatant => combatant.token);
    await documentUtils.update(actor, {'system.attributes.inspiration': false});
    await workflowUtils.completeActivityUse(activity, [token, ...new Set(allies)]);
}
export const zhentarimRuffian = {
    name: 'Zhentarim Ruffian',
    version: '2.1.11',
    rules: '2024',
    combat: [
        {
            pass: 'actorPreInitiative',
            macro: preInitiative,
            priority: 50
        }
    ],
    roll: [
        {
            pass: 'actorDamageRoll',
            macro: count,
            priority: 10
        },
        {
            pass: 'actorDamageRollComplete',
            macro: damage,
            priority: 25
        }
    ],
    config: {
        keep: {
            default: '',
            type: 'select',
            label: 'CHRISPREMADES.Macros.Modern.ExploitOpening.Keep',
            category: 'behavior',
            get options() {
                return [
                    {value: '', label: 'CHRISPREMADES.Macros.Modern.ExploitOpening.Ask'},
                    {value: 'higher', label: 'CHRISPREMADES.Macros.Modern.ExploitOpening.Higher'}
                ];
            }
        }
    }
};
