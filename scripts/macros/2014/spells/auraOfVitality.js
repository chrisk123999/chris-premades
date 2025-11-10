import {activityUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'auraOfVitalityHealing', {strict: true});
    if (!feature) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item)
    };
    await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item, 
        strictlyInterdependent: true,
        vae: [{
            type: 'use', 
            name: feature.name, 
            identifier: 'auraOfVitality', 
            activityIdentifier: 'auraOfVitalityHealing'
        }],
        identifier: 'auraOfVitality',
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['auraOfVitalityHealing'],
            favorite: true
        }
    });
    let blessedHealer = itemUtils.getItemByIdentifier(workflow.actor, 'blessedHealer');
    if (!blessedHealer) return;
    let validTypes = ['spell', 'pact'];
    if (!validTypes.includes(workflow.item.system.method)) return;
    let castLevel = workflowUtils.getCastLevel(workflow);
    if (!castLevel) return;
    if (workflow.targets.size === 1 && workflow.targets.first().document.uuid === workflow.token.document.uuid) return;
    let activity = activityUtils.getActivityByIdentifier(blessedHealer, 'heal', {strict: true});
    if (!activity) return;
    let itemData = genericUtils.duplicate(blessedHealer.toObject());
    itemData.system.activities[activity.id].healing.bonus = itemUtils.getConfig(blessedHealer, 'baseHealing') + castLevel;
    await workflowUtils.syntheticItemDataRoll(itemData, workflow.actor, [workflow.token]);
}
async function early({dialog}) {
    dialog.configure = false;
}
export let auraOfVitality = {
    name: 'Aura of Vitality',
    version: '1.2.28',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['auraOfVitality']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['auraOfVitalityHealing']
            }
        ]
    }
};