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
}
async function early({dialog}) {
    dialog.configure = false;
}
export let auraOfVitality = {
    name: 'Aura of Vitality',
    version: '1.1.10',
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