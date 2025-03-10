import {activityUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function heal({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size || !workflow.item || !workflow.token) return;
    if (workflow.item.type != 'spell' || activityUtils.isSpellActivity(workflow.activity)) return;
    if (!workflowUtils.getDamageTypes(workflow.damageRolls).has('healing')) return;
    let validTypes = ['prepared', 'pact', 'always'];
    if (!validTypes.includes(workflow.item.system.preparation.mode)) return;
    let castLevel = workflowUtils.getCastLevel(workflow);
    if (!castLevel) return;
    if (workflow.targets.size === 1 && workflow.targets.first().document.uuid === workflow.token.document.uuid) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'heal', {strict: true});
    if (!activity) return;
    let itemData = genericUtils.duplicate(item.toObject());
    itemData.system.activities[activity.id].healing.bonus = itemUtils.getConfig(item, 'baseHealing') + castLevel;
    await workflowUtils.syntheticItemDataRoll(itemData, workflow.actor, [workflow.token]);
}
export let blessedHealer = {
    name: 'Blessed Healer',
    version: '1.2.18',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: heal,
                priority: 250
            }
        ]
    },
    config: [
        {
            value: 'baseHealing',
            label: 'CHRISPREMADES.Config.BaseHealing',
            type: 'number',
            default: 2,
            category: 'homebrew',
            homebrew: true
        }
    ]
};