import {activityUtils, dialogUtils, effectUtils, genericUtils, socketUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.token || !workflow.targets.size) return;
    let willing = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Influence.HowWilling', [
        ['CHRISPREMADES.Macros.Influence.Willing', false],
        ['CHRISPREMADES.Macros.Influence.Unwilling', false],
        ['CHRISPREMADES.Macros.Influence.Hesitant', true]
    ], {displayAsRows: true, userId: socketUtils.gmID()});
    if (!willing) return;
    let attitude = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Influence.Attitude', [
        ['CHRISPREMADES.Macros.Influence.Indifferent', 'indifferent'],
        ['CHRISPREMADES.Macros.Influence.Friendly', 'friendly'],
        ['CHRISPREMADES.Macros.Influence.Hostile', 'hostile'],
    ], {displayAsRows: true, userId: socketUtils.gmID()});
    if (!attitude) return;
    let skill = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Influence.Skill', [
        ['DND5E.SkillDec', 'dec'],
        ['DND5E.SkillItm', 'itm'],
        ['DND5E.SkillPrf', 'prf'],
        ['DND5E.SkillPer', 'per'],
        ['DND5E.SkillAni', 'ani']
    ], {displayAsRows: true, userId: socketUtils.gmID()});
    if (!skill) return;
    let sourceEffect;
    switch (attitude) {
        case 'friendly': sourceEffect = workflow.item.effects.contents?.[0]; break;
        case 'hostile': sourceEffect = workflow.item.effects.contents?.[1]; break;
    }
    if (sourceEffect) {
        let effectData = genericUtils.duplicate(sourceEffect.toObject());
        effectData.origin = sourceEffect.uuid;
        effectData.duration = {seconds: 1};
        await effectUtils.createEffect(workflow.actor, effectData);
    }
    let activity = activityUtils.getActivityByIdentifier(workflow.item, 'check', {strict: true});
    if (!activity) return;
    let activityData = genericUtils.duplicate(activity.toObject());
    activityData.check.associated = [skill];
    activityData.check.dc.formula = Math.max(15, workflow.targets.first().actor.system.abilities.int.value);
    await workflowUtils.syntheticActivityDataRoll(activityData, workflow.item, workflow.actor, [workflow.token]);
}
export let influence = {
    name: 'Influence',
    version: '1.3.115',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['use']
            }
        ]
    }
};