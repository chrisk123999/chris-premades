import {activityUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    if (activityUtils.getIdentifier(workflow.activity) !== genericUtils.getIdentifier(workflow.item)) return;
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
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
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: effectData.duration});
}
async function early({workflow}) {
    if (activityUtils.getIdentifier(workflow.activity) !== 'auraOfVitalityHealing') return;
    workflowUtils.skipDialog(workflow);
}
export let auraOfVitality = {
    name: 'Aura of Vitality',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50
            }
        ]
    }
};