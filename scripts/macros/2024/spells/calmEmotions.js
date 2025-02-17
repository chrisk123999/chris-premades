import {actorUtils, constants, dialogUtils, effectUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function early({trigger, workflow}) {
    if (!workflow.targets.size) return;
    await Promise.all(workflow.targets.map(async token => {
        if (actorUtils.typeOrRace(token.actor) === 'humanoid') return;
        await effectUtils.createEffect(token.actor, constants.immuneEffectData);
    }));
}
async function use({trigger, workflow}) {
    await workflowUtils.handleInstantTemplate(workflow);
    if (!workflow.failedSaves.size) return;
    let selection = await dialogUtils.selectTargetDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectTargetEffect', Array.from(workflow.failedSaves), {
        type: 'select',
        skipDeadAndUnconscious: false,
        selectOptions: [
            {
                label: 'CHRISPREMADES.Macros.CalmEmotions.ConditionImmunity',
                value: 'ci'
            },
            {
                label: 'CHRISPREMADES.Macros.CalmEmotions.Indifference',
                value: 'indifference'
            }
        ]
    });
    if (!selection) return;
    let ciEffectData = workflow.item.effects.contents[0]?.toObject();
    if (!ciEffectData) return;
    delete ciEffectData._id;
    ciEffectData.origin = workflow.item.uuid;
    ciEffectData.duration = itemUtils.convertDuration(workflow.item);
    let iEffectData = workflow.item.effects.contents[1]?.toObject();
    if (!iEffectData) return;
    delete iEffectData._id;
    iEffectData.origin = workflow.item.uuid;
    iEffectData.duration = itemUtils.convertDuration(workflow.item);
    await Promise.all(selection[0].map(async i => {
        await effectUtils.createEffect(i.document.actor, i.value === 'ci' ? ciEffectData : iEffectData, {concentrationItem: workflow.item});
    }));
}
export let calmEmotions = {
    name: 'Calm Emotions',
    version: '1.1.19',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};