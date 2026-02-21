import {itemUtils} from '../../../../utils.js';
async function early({trigger: {entity: item}, workflow}) {
    let config = itemUtils.getGenericFeatureConfig(workflow.item, 'bloodFrenzy');
    let activities = config.activities;
    if (activities?.length && !activities.includes(workflow.activity.id)) return;
    if (workflow.targets.size !== 1) return;
    let hp = workflow.targets.first().actor.system.attributes.hp;
    if (hp.value === hp.max) return;
    workflow.tracker.advantage.add(item.name, item.name);
}
export let bloodFrenzy = {
    name: 'Blood Frenzy',
    translation: 'CHRISPREMADES.Macros.BloodFrenzy.Name',
    version: '1.3.38',
    midi: {
        actor: [
            {
                pass: 'preAttackRollConfig',
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
        }
    ]
};