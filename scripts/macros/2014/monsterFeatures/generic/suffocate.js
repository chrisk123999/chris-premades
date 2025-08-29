import {_suffocationApply} from '../../../2024/actions/suffocation.js';
import {actorUtils, itemUtils} from '../../../../utils.js';
async function use({trigger: {entity}, workflow}) {
    if (!workflow.targets) return;
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'suffocate');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    await Promise.all(workflow.targets.map(async i => {
        let effect = actorUtils.getEffects(i.actor).find(j => workflow.activity.effects.map(i => i.effect.uuid).includes(j.origin));
        if (!effect) return;
        await _suffocationApply(i.actor, entity, {parentEffect: effect, startsOutOfAir: config.startsOutOfAir});
    }));
}
export let suffocate = {
    name: 'Suffocate',
    translation: 'CHRISPREMADES.Macros.Suffocate.Name',
    version: '1.3.34',
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
            value: 'startsOutOfAir',
            label: 'CHRISPREMADES.Macros.Suffocate.StartsOutOfAir',
            type: 'checkbox',
            default: false
        }
    ]
};