import {itemUtils, tokenUtils, actorUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.token || !workflow.targets.size) return;
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'autoPush');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    if (isNaN(Number(config.distance))) return;
    workflow.targets.forEach(token => {
        if (config.failed && !workflow.failedSaves.has(token)) return;
        if (config.hit && !workflow.hitTargets.has(token)) return;
        if (config.maxSize != 'none' && !actorUtils.compareSize(token, config.maxSize, '<=')) return;
        let distance = Number(config.distance);
        if (distance < 0) {
            let distanceBetween = tokenUtils.getDistance(workflow.token, token);
            distance = Math.max(distance, -distanceBetween);
        }
        tokenUtils.pushToken(workflow.token, token, distance);
    });
}
function actorSizes() {
    if (!CONFIG?.DND5E?.actorSizes) return false;
    return Object.entries(CONFIG.DND5E.actorSizes).reduce((options, [key, value]) => {
        options.push({label: value.label, value: key});
        return options;
    }, [{label: 'DND5E.None', value: 'none'}]);
}
export let autoPush = {
    name: 'Auto Push',
    translation: 'CHRISPREMADES.Macros.AutoPush.Name',
    version: '1.0.45',
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
            value: 'distance',
            label: 'CHRISPREMADES.Config.Distance',
            type: 'number',
            default: 10
        },
        {
            value: 'failed',
            label: 'CHRISPREMADES.Config.FailedSave',
            type: 'checkbox',
            default: true
        },
        {
            value: 'hit',
            label: 'CHRISPREMADES.Config.HitTarget',
            type: 'checkbox',
            default: true
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