import {activityUtils, constants, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let feature1 = activityUtils.getActivityByIdentifier(workflow.item, 'flameBladeScimitar', {strict: true});
    let feature2 = activityUtils.getActivityByIdentifier(workflow.item, 'flameBladeEvoke', {strict: true});
    if (!feature1 || !feature2) {
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
                key: 'ATL.light.dim',
                mode: 4,
                value: 20,
                priority: 20
            },
            {
                key: 'ATL.light.bright',
                mode: 4,
                value: 10,
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                castData: workflow.castData
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item,
        identifier: 'flameBlade',
        vae: [{
            type: 'use', 
            name: feature1.name,
            identifier: 'flameBlade',
            activityIdentifier: 'flameBladeScimitar'
        }, {
            type: 'use', 
            name: feature2.name,
            identifier: 'flameBlade', 
            activityIdentifier: 'flameBladeEvoke'
        }],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['flameBladeScimitar', 'flameBladeEvoke'],
            favorite: true
        }
    });
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {duration: effectData.duration});
}
async function early({workflow}) {
    let activityId = activityUtils.getIdentifier(workflow.activity);
    if (activityId === 'flameBladeEvoke') {
        workflowUtils.skipDialog(workflow);
        return;
    }
    if (activityId !== 'flameBladeScimitar') return;
    if (workflow.activity.tempFlag) {
        workflow.activity.tempFlag = false;
        return;
    }
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'flameBlade');
    if (!effect) return true;
    workflow.activity.tempFlag = true;
    genericUtils.sleep(100).then(() => workflowUtils.syntheticActivityRoll(workflow.activity, Array.from(workflow.targets), {atLevel: effect.flags['chris-premades'].castData.castLevel}));
    return true;
}
export let flameBlade = {
    name: 'Flame Blade',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['flameBlade']
            },
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'fire',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};