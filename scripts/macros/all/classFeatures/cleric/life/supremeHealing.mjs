import {automationUtils, documentUtils, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
async function maximize({document: item, workflow}) {
    if (!workflow.targets.count || !workflow.damageRolls?.length) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('healing')) return;
    const exceptions = automationUtils.getConfigValue(item, 'identifiers');
    if (workflow.item.type !== 'spell' && !exceptions.includes(documentUtils.getIdentifier(workflow.item))) return;
    const rolls = await Promise.all(workflow.damageRolls.map(d =>
        d.options.type === 'healing' ? rollUtils.maximizeRoll(d) : d
    ));
    await workflow.setDamageRolls(rolls);
    await workflowUtils.syntheticItemRoll(item);
}
export const supremeHealing = {
    name: 'Supreme Healing',
    version: '2.1.9',
    rules: 'all',
    roll: [
        {
            pass: 'actorDamageRollComplete',
            macro: maximize,
            priority: 200
        }
    ],
    config: {
        identifiers: {
            default: ['channel-divinity'],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Identifier'
        }
    }
};
