import {activityUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
import {proneOnFail} from '../generic/proneOnFail.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'investitureOfStoneEarthquake', {strict: true});
    if (!feature) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'system.traits.dr.custom',
                mode: 0,
                value: 'Non-Magical Physical',
                priority: 20
            }
        ]
    };
    await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item, 
        strictlyInterdependent: true, 
        identifier: 'investitureOfStone', 
        vae: [{
            type: 'use', 
            name: feature.name,
            identifier: 'investitureOfStone', 
            activityIdentifier: 'investitureOfStoneEarthquake'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['investitureOfStoneEarthquake'],
            favorite: true
        }
    });
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: effectData.duration});
}
async function early({dialog}) {
    dialog.configure = false;
}
export let investitureOfStone = {
    name: 'Investiture of Stone',
    version: '1.2.28',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['investitureOfStone']
            },
            {
                pass: 'rollFinished',
                macro: proneOnFail.midi.item[0].macro,
                priority: 50,
                activities: ['investitureOfStoneEarthquake']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['investitureOfStoneEarthquake']
            }
        ]
    }
};