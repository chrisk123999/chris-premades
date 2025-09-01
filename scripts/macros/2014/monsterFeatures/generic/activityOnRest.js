import {actorUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';
async function rollFinished({trigger, workflow}) {
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'activityOnRest');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    if (!config.triggerActivities.length) {
        genericUtils.notify('CHRISPREMADES.Macros.ActivityOnRest.NoActivity', 'error');
        return;
    }
    let targets;
    if (config.checkHit) {
        targets = workflow.hitTargets;
    }
    if (config.checkSave) {
        if (!targets.size) targets = workflow.failedSaves;
        else targets.filter(i => workflow.failedSaves.has(i));
    }
    if (!targets.size) return;
    await Promise.all(targets.map(async i => {
        let effect = actorUtils.getEffects(i.actor).find(j => workflow.activity.effects.map(k => k.effect.uuid).includes(j.origin));
        let currentMacroList = genericUtils.getProperty(effect, 'flags.chris-premades.macros.rest') ?? [];
        await genericUtils.setFlag(effect, 'chris-premades', 'macros.rest', currentMacroList.concat(['activityOnRestActor']));
    }));
}
async function rest({trigger: {entity, data}, actor}) {
    let token = actorUtils.getFirstToken(actor);
    if (!token) return;
    let sourceItem = await effectUtils.getOriginItem(entity);
    if (!sourceItem) return;
    let config = itemUtils.getGenericFeatureConfig(sourceItem, 'activityOnRest');
    if (config.longRestOnly && data.type != 'long') return;
    let triggerActivities = config.triggerActivities.map(i => sourceItem.system.activities.find(j => j.id === i));
    if (!triggerActivities.length) return;
    for (let i of triggerActivities) {
        let activityWorkflow = await workflowUtils.syntheticActivityRoll(i, [token]);
        if (config.triggerOnce || (config.expireOnSave && !activityWorkflow.failedSaves.has(token))) {
            if (entity) await genericUtils.remove(entity);
        }
    }
}
export let activityOnRest = {
    name: 'Activity on Rest',
    translation: 'CHRISPREMADES.Macros.ActivityOnRest.Name',
    version: '1.3.31',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: rollFinished,
                priority: 50,
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'activities',
            label: 'CHRISPREMADES.Config.Activities',
            type: 'activities',
            default: []
        },
        {
            value: 'triggerActivities',
            label: 'CHRISPREMADES.Macros.ActivityOnRest.TriggerActivities',
            type: 'activities',
            default: []
        },
        {
            value: 'checkHit',
            label: 'CHRISPREMADES.Config.CheckHit',
            type: 'checkbox',
            default: true
        },
        {
            value: 'checkSave',
            label: 'CHRISPREMADES.Config.CheckSave',
            type: 'checkbox',
            default: true
        },
        {
            value: 'longRestOnly',
            label: 'CHRISPREMADES.Macros.ActivityOnRest.LongRest',
            type: 'checkbox',
            default: false
        },
        {
            value: 'expireOnSave',
            label: 'CHRISPREMADES.Macros.ActivityOnRest.ExpireOnSave',
            type: 'checkbox',
            default: true
        },
        {
            value: 'triggerOnce',
            label: 'CHRISPREMADES.Macros.ActivityOnRest.TriggerOnce',
            type: 'checkbox',
            default: false
        }
    ]
};
export let activityOnRestActor = {
    name: 'Activity On Rest Actor',
    version: '1.3.30',
    rest: [
        {
            pass: 'short',
            macro: rest,
            priority: 50
        }
    ]
};