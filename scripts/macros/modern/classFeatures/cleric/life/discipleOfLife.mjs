import {itemUtils, workflowUtils} from '../../../../../proxy.mjs';
async function heal({document, workflow}) {
    const validTypes = ['spell', 'pact'];
    if (!workflow.targets.size || !workflow.item || !workflow.damageRolls) return;
    if (!(workflow.item.type === 'spell' || workflow.item.system.type?.value === 'spellFeature')) return;
    if (workflow.item.type === 'spell' && !validTypes.includes(workflow.item.system.method)) return;
    const castData = workflow.castData ?? itemUtils.getSavedCastData(workflow.item);
    if (!(castData?.castLevel > 0)) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('healing')) return;
    const formula = 2 + castData.castLevel;
    await workflowUtils.bonusDamage(workflow, formula, {damageType: 'healing'});
    await workflowUtils.completeItemUse(document, [], {consumeUsage: false, consumeResources: false});
}
export const discipleOfLife = {
    name: 'Disciple of Life',
    version: '2.1.4',
    rules: '2024',
    roll: [
        {
            pass: 'actorDamageRollComplete',
            macro: heal,
            priority: 250
        }
    ]
};
