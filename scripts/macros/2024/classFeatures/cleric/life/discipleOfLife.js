import {itemUtils, workflowUtils} from '../../../../../utils.js';
async function heal({trigger: {entity: item}, workflow}) {
    let validTypes = ['spell', 'pact'];
    if (!workflow.targets.size || !workflow.item || !workflow.damageRolls) return;
    if (!(workflow.item.type === 'spell' || workflow.item.system.type?.value === 'spellFeature')) return;
    if (workflow.item.type === 'spell') if (!validTypes.includes(workflow.item.system.method)) return;
    let castData = workflow.castData ?? itemUtils.getSavedCastData(workflow.item);
    if (!castData?.castLevel) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('healing')) return;
    let formula = 2 + castData.castLevel;
    await workflowUtils.bonusDamage(workflow, formula, {damageType: 'healing'});
    await item.displayCard();
}
export let discipleOfLife = {
    name: 'Disciple of Life',
    version: '1.2.13',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: heal,
                priority: 250
            }
        ]
    }
};