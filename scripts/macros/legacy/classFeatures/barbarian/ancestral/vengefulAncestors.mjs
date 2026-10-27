import {documentUtils, Logging, workflowUtils} from '../../../../../proxy.mjs';
async function vengeance({document: activity, macroClass: {identifier, source}, workflow}) {
    if (documentUtils.getIdentifier(workflow.item) !== 'spirit-shield') return;
    const dealt = workflowUtils.getWorkflowProperty(workflow, 'spiritShieldDamage') ?? 0;
    const damage = Math.min(dealt, workflow.utilityRoll.total);
    if (!damage) return Logging.addMacroWarning(source, identifier, `Vengeful Ancestors exited early due to missing or 0 vengeance damage. (activity) ${activity.uuid} (dealt) ${dealt}, (reduce roll) ${workflow.utilityRoll.total}`);
    await workflowUtils.syntheticActivityRoll(activity, workflow.targets.map(t => t.document), {config: {scaling: damage - 1}});
}
export const vengefulAncestors = {
    name: 'Vengeful Ancestors',
    version: '2.1.4',
    rules: '2014',
    roll: [
        {
            pass: 'actorUtilityRollComplete',
            macro: vengeance,
            priority: 200
        }
    ]
};
