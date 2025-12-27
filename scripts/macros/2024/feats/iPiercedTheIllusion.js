import {activityUtils, effectUtils, genericUtils, workflowUtils} from '../../../utils.js';
async function turnStart({trigger: {entity: item}}) {
    let charmed = effectUtils.getEffectByIdentifier(item.actor, 'charmed');
    if (!charmed) return;
    let acitivity = activityUtils.getActivityByIdentifier(item, 'charmed', {strict: true});
    if (!acitivity) return;
    await workflowUtils.syntheticActivityRoll(acitivity, []);
}
async function use({trigger, workflow}) {
    let charmed = effectUtils.getEffectByStatusID(workflow.actor, 'charmed');
    if (!charmed || workflow.utilityRolls[0].total < 10) return;
    await genericUtils.remove(charmed);
}
async function skill({trigger: {skillId}}) {
    if (skillId !== 'ins') return;
    return {label: 'CHRISPREMADES.Macros.IPiercedTheIllusion.Insight', type: 'advantage'};
}
export let iPiercedTheIllusion = {
    name: 'I Pierced the Illusion',
    version: '1.4.5',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['charmed']
            }
        ]
    },
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ],
    skill: [
        {
            pass: 'context',
            macro: skill,
            priority: 50
        }
    ]
};