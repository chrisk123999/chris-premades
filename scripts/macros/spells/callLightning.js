import {activityUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = await effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let storming = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.CallLightning.Storming');
    let castLevel = workflow.castData.castLevel;
    if (storming) castLevel += 1;
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'stormBolt', {strict: true});
    if (!feature) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                castData: {
                    castLevel
                }
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item, 
        strictlyInterdependent: true, 
        identifier: 'callLightning', 
        vae: [{
            type: 'use', 
            name: feature.name,
            identifier: 'callLightning', 
            activityIdentifier: 'stormBolt'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['stormBolt'],
            favorite: true
        }
    });
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: effectData.duration});
    await workflowUtils.completeActivityUse(feature);
}
async function early({workflow}) {
    if (workflow.activity.tempFlag) {
        workflow.activity.tempFlag = false;
        return;
    }
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'callLightning');
    if (!effect) return true;
    workflow.activity.tempFlag = true;
    genericUtils.sleep(100).then(() => workflowUtils.syntheticActivityRoll(workflow.activity, [], {atLevel: effect.flags['chris-premades'].castData.castLevel}));
    return true;
}
export let callLightning = {
    name: 'Call Lightning',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['callLightning']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50,
                activities: ['stormBolt']
            }
        ]
    }
};