import {actorUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function early({trigger, workflow}) {
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'timeTrigger');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    let sourceEffect = workflow.activity.effects[0]?.effect ?? workflow.activity._otherActivity?.effects?.[0]?.effect;
    if (!sourceEffect) return;
    if (sourceEffect.flags.dae?.dontApply) return;
    await genericUtils.setFlag(sourceEffect, 'dae', 'dontApply', true);
}
async function use({trigger, workflow}) {
    if (!workflow.hitTargets.size) return;
    let sourceEffect = workflow.activity.effects[0]?.effect ?? workflow.activity._otherActivity?.effects?.[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'timeTrigger');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    let actor = tokenUtils.getBaseActor(workflow.token);
    if (!actor) return;
    let item = actor.items.get(workflow.item.id);
    if (!item) return;
    let activity = item.system.activities.get(config.triggerActivity);
    if (!activity) return;
    effectUtils.addMacro(effectData, 'time', ['timeTriggerEffect']);
    genericUtils.setProperty(effectData, 'flags.chris-premades.timeTrigger', {
        triggerActivityUuid: activity.uuid,
        timeFormat: config.timeFormat,
        time: config.time
    });
    for (let token of workflow.hitTargets) {
        let effect = actorUtils.getEffects(token.actor).find(i => i.origin === sourceEffect.uuid);
        if (effect) continue;
        if (config.checkSaves && !workflow.failedSaves.has(token)) continue;
        await effectUtils.createEffect(token.actor, effectData);
    }
}
async function timeUpdated({trigger: {entity: effect, worldTime, token}}) {
    if (!token) return;
    let lastUsed = effect.flags['chris-premades']?.timeTrigger?.lastUsed ?? effect.duration.startTime;
    if (lastUsed > worldTime) return;
    let diff = worldTime - lastUsed;
    let units = effect.flags['chris-premades']?.timeTrigger?.timeFormat;
    let value = effect.flags['chris-premades']?.timeTrigger?.time;
    let convertedTime = DAE.convertDuration({units, value}, false).seconds;
    let intervalsPassed = Math.floor(diff / convertedTime);
    if (intervalsPassed <= 0) return;
    await genericUtils.setFlag(effect, 'chris-premades', 'timeTrigger.lastUsed', lastUsed + (intervalsPassed * convertedTime));
    let triggerActivityUuid = effect.flags['chris-premades']?.timeTrigger?.triggerActivityUuid;
    if (!triggerActivityUuid) return;
    let activity = await fromUuid(triggerActivityUuid);
    if (!activity) return;
    for (let i = 0; i < intervalsPassed; i++) await workflowUtils.syntheticActivityRoll(activity, [token]);
}
export let timeTrigger = {
    name: 'Time Trigger',
    translation: 'CHRISPREMADES.Macros.TimeTrigger.Name',
    version: '1.5.2',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'preambleComplete',
                macro: early,
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
            value: 'triggerActivity',
            label: 'CHRISPREMADES.Config.TriggerActivity',
            type: 'activity',
            default: ''
        },
        {
            value: 'checkSaves',
            label: 'CHRISPREMADES.Config.CheckSaves',
            type: 'checkbox',
            default: true
        },
        {
            value: 'time',
            label: 'CHRISPREMADES.Config.Time',
            type: 'number',
            default: 1
        },
        {
            value: 'timeFormat',
            label: 'CHRISPREMADES.Config.TimeFormat',
            type: 'select',
            default: 'days',
            options: [
                {
                    value: 'minutes',
                    label: 'TIME.Minute.other'
                },
                {
                    value: 'hours',
                    label: 'TIME.Hour.other'
                },
                {
                    value: 'days',
                    label: 'TIME.Day.other'
                },
                {
                    value: 'months',
                    label: 'DND5E.TimeMonth'
                },
                {
                    value: 'years',
                    label: 'TIME.Year.other'
                }
            ]
        }
    ]
};
export let timeTriggerEffect = {
    name: 'Time Trigger Effect',
    version: timeTrigger.version,
    time: [
        {
            pass: 'timeUpdated',
            macro: timeUpdated,
            priority: 50
        }
    ]
};