import {automationUtils, documentUtils, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
async function allTargets({document: activity, workflow}) {
    if (!workflow.targets.count || !workflow.damageRolls?.length) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('healing')) return;
    const exceptions = automationUtils.getConfigValue(activity.item, 'identifiers');
    if (workflow.item.type !== 'spell' && !exceptions.includes(documentUtils.getIdentifier(workflow.item))) return;
    const targets = workflow.targets.documents.filter(t => t.actor && t.actor.system.attributes.hp.value === 0);
    if (!targets.length) return;
    const rolls = await Promise.all(workflow.damageRolls.map(d =>
        d.options.type === 'healing' && !d.isDeterministic ? rollUtils.maximizeRoll(d) : d
    ));
    const data = {eligible: true, max: rolls.reduce((acc, roll) => acc + (roll.options.type === 'healing') * roll.total, 0)};
    if (workflow.targets.count === targets.length) {
        await workflow.setDamageRolls(rolls);
        data.used = true;
    }
    data.targets = targets.map(t => t.uuid);
    await workflowUtils.syntheticActivityRoll(activity, targets);
    workflowUtils.setWorkflowProperty(workflow, 'circleOfMortality', data);
}
async function someTargets({ditem, workflow}) {
    const data = workflowUtils.getWorkflowProperty(workflow, 'circleOfMortality');
    if (!data?.eligible || data.used || !data.targets.includes(ditem.targetUuid)) return;
    const diff = ditem.damageDetail.reduce((acc, d) => acc + (d.type === 'healing') * d.value, data.max);
    if (diff > 0) workflowUtils.modifyDamageAppliedFlat(ditem, diff, {type: 'healing', multiplier: 'auto'});
}
export const circleOfMortality = {
    name: 'Circle of Mortality',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'actorDamageRollComplete',
            macro: allTargets,
            priority: 200
        },
        {
            pass: 'actorDamage',
            macro: someTargets,
            priority: 200
        }
    ],
    config: {
        identifiers: {
            default: ['channel-divinity'],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Identifiers'
        }
    }
};
