import {activityUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    if (activityIdentifier === genericUtils.getIdentifier(workflow.item)) {
        let concentrationEffect = await effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
        let feature = activityUtils.getActivityByIdentifier(workflow.item, 'probeDeeper', {strict: true});
        if (!feature) {
            if (concentrationEffect) await genericUtils.remove(concentrationEffect);
            return;
        }
        let effectData = {
            name: workflow.item.name,
            img: workflow.item.img,
            origin: workflow.item.uuid,
            duration: itemUtils.convertDuration(workflow.item)
        };
        await effectUtils.createEffect(workflow.actor, effectData, {
            concentrationItem: workflow.item, 
            strictlyInterdependent: true, 
            identifier: 'detectThoughts', 
            vae: [{
                type: 'use', 
                name: feature.name, 
                identifier: 'detectThoughts',
                activityIdentifier: 'probeDeeper'
            }],
            unhideActivities: {
                itemUuid: workflow.item.uuid,
                activityIdentifiers: ['probeDeeper'],
                favorite: true
            }
        });
        if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: effectData.duration});
    } else if (activityIdentifier === 'probeDeeper') {
        if (workflow.failedSaves.size) return;
        let effect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item.origin);
        if (effect) await genericUtils.remove(effect);
    }
}
async function early({workflow}) {
    if (activityUtils.getIdentifier(workflow.activity) !== 'probeDeeper') return;
    workflowUtils.skipDialog(workflow);
}
export let detectThoughts = {
    name: 'Detect Thoughts',
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