import {activityUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function heal({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size || !workflow.item || !workflow.damageRolls) return;
    if (!(workflow.item.type === 'spell' || workflow.item.system.type?.value === 'spellfeature')) return;
    let castData = workflow.castData ?? itemUtils.getSavedCastData(workflow.item);
    if (!castData?.castLevel) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('healing')) return;
    if (workflow.targets.size === 1 && workflow.targets.first().document.uuid === workflow.token.document.uuid) return;
    let feature = activityUtils.getActivityByIdentifier(item, 'blessedHealer', {strict: true});
    if (!feature) return;
    await activityUtils.setDamage(feature, 2 + castData.castLevel);
    await workflowUtils.syntheticActivityRoll(feature, [workflow.token]);
}
export let blessedHealer = {
    name: 'Blessed Healer',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: heal,
                priority: 250
            }
        ]
    }
};