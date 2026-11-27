import {combatUtils, dialogUtils, documentUtils, workflowUtils} from '../../../../../proxy.mjs';
async function attackConfig({document: item, workflow}) {
    if (!workflow.tracker?.hasAdvantage || workflow.tracker.hasDisadvantage || workflow.targets.count !== 1) return;
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack') || workflow.activity.activation?.type !== 'action') return;
    if (!workflow.token || !combatUtils.isOwnTurn(workflow.token.document)) return;
    if (!item.system.uses.value) return;
    if (!await dialogUtils.confirmUseItem(item)) return;
    await documentUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
    workflow.tracker.disadvantage.add('rapid-strike', item.name);
    workflowUtils.setWorkflowProperty(workflow, 'rapidStrikeQueued', true);
}
async function finished({workflow}) {
    if (!workflowUtils.getWorkflowProperty(workflow, 'rapidStrikeQueued')) return;
    await workflowUtils.syntheticActivityRoll(workflow.activity, workflow.targets.documents);
}
export const rapidStrike = {
    name: 'Rapid Strike',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'actorAttackRollConfig',
            macro: attackConfig,
            priority: 350
        },
        {
            pass: 'actorRollFinished',
            macro: finished,
            priority: 50
        }
    ]
};
