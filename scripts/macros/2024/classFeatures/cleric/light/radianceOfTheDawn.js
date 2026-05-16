import {activityUtils, constants, effectUtils, genericUtils, itemUtils, templateUtils, tokenUtils} from '../../../../../utils.js';
async function early({trigger, workflow}) {
    if (!workflow.token) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'coronaOfLightEffect');
    if (!effect) return;
    await Promise.all(workflow.targets.map(async token => {
        let distance = tokenUtils.getDistance(workflow.token, token);
        if (distance > genericUtils.convertDistance(60)) return;
        await effectUtils.createEffect(token.actor, constants.disadvantageEffectData);
    }));
}
async function use({trigger, workflow}) {
    if (!workflow.template) return;
    let darknessTemplates = workflow.template.parent.templates.filter(template => template.flags['chris-premades']?.template?.visibility?.magicalDarkness).filter(template => templateUtils.overlap(workflow.template, template));
    await genericUtils.deleteEmbeddedDocuments(workflow.template.parent, 'MeasuredTemplate', darknessTemplates.map(i => i.id));
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['use'], 'channelDivinity');
}
export let radianceOfTheDawn = {
    name: 'Radiance of the Dawn',
    version: '1.3.8',
    rules: 'modern',
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
                priority: 100
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 50
        }
    ]
};