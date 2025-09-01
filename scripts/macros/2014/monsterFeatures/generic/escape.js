import {actorUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function use({workflow}) {
    if (!workflow.token || workflow.targets.size != 1) return;
    let targetToken = workflow.targets.first();
    let sourceToken = workflow.token;
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'escape');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    if (config.maxSize && config.maxSize != 'none' && !actorUtils.compareSize(targetToken, config.maxSize, '<=')) return;
    let triggerActivities = config.triggerActivities.map(i => workflow.item.system.activities.find(j => j.id === i));
    for (let i of triggerActivities) {
        await workflowUtils.syntheticActivityRoll(i, [workflow.hitTargets.first()]);
    }
    let itemEffects = (workflow.item.effects.map(i => i.uuid));
    let sourceEffect = actorUtils.getEffects(sourceToken.actor)?.find(i => itemEffects.includes(i.origin));
    let targetEffect = actorUtils.getEffects(targetToken.actor)?.find(i => itemEffects.includes(i.origin));
    let dc = config.flatDC ?? (8 + sourceToken.actor.system.abilities.str.mod + sourceToken.actor.system.attributes.prof);
    await tokenUtils.grappleHelper(sourceToken, targetToken, workflow.item, {targetEffect, sourceEffect, noContest: true, flatDC: dc});
}
function actorSizes() {
    if (!CONFIG?.DND5E?.actorSizes) return false;
    return Object.entries(CONFIG.DND5E.actorSizes).reduce((options, [key, value]) => {
        options.push({label: value.label, value: key});
        return options;
    }, [{label: 'DND5E.None', value: 'none'}]);
}
export let escape = {
    name: 'Escape',
    translation: 'CHRISPREMADES.Macros.Escape.Name',
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
            value: 'maxSize',
            label: 'CHRISPREMADES.Config.MaxSize',
            type: 'select',
            default: false,
            options: actorSizes
        }
    ]
};