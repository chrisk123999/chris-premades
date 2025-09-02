import {actorUtils, itemUtils, effectUtils, genericUtils, workflowUtils} from '../../../../utils.js';
async function use({workflow}) {
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'activityOnEffectExpiry');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    let targets = workflow.hitTargets;
    await Promise.all(targets.map(async i => {
        let effect = actorUtils?.getEffects(i.actor)?.find(j => workflow.activity?.effects?.map(k => k?.effect?.uuid).includes(j?.origin));
        if (!effect) return;
        let currentMacroList = genericUtils.getProperty(effect, 'flags.chris-premades.macros.effect') ?? [];
        await genericUtils.setFlag(effect, 'chris-premades', 'macros.effect', currentMacroList.concat(['activityOnEffectExpiry']));
    }));
}
async function deleted({trigger: {entity, options}}) {
    let token = actorUtils.getFirstToken(entity.parent);
    if (!token) return;
    let sourceItem = await effectUtils.getOriginItem(entity);
    if (!sourceItem) return;
    let config = itemUtils.getGenericFeatureConfig(sourceItem, 'activityOnEffectExpiry');
    if (config.endEarly && entity.duration.remaining && !options['expiry-reason']) return;
    let triggerActivities = config.triggerActivities.map(i => sourceItem.system.activities.find(j => j.id === i));
    for (let i of triggerActivities) {
        await workflowUtils.syntheticActivityRoll(i, [token]);
    }
}
export let activityOnEffectExpiry = {
    name: 'Activity on Effect Expiry',
    translation: 'CHRISPREMADES.Macros.ActivityOnEffectExpiry.Name',
    version: '1.3.39',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    effect: [
        {
            pass: 'deleted',
            macro: deleted,
            priority: 50
        }
    ],
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
            value: 'endEarly',
            label: 'CHRISPREMADES.Macros.ActivityOnEffectExpiry.EndEarly',
            type: 'checkbox',
            default: true
        }
    ]
};