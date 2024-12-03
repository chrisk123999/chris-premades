import {itemUtils, workflowUtils} from '../../../../utils.js';
async function heal({trigger, workflow}) {
    if (!workflow.targets.size || !workflow.item || !workflow.damageRolls) return;
    if (!(workflow.item.type === 'spell' || workflow.item.system.type?.value === 'spellFeature')) return;
    let castData = workflow.castData ?? itemUtils.getSavedCastData(workflow.item);
    if (!castData?.castLevel) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('healing')) return;
    let formula = 2 + castData.castLevel;
    await workflowUtils.bonusDamage(workflow, formula, {damageType: 'healing'});
    await trigger.entity.use();
}
export let discipleOfLife = {
    name: 'Disciple of Life',
    version: '1.1.0',
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