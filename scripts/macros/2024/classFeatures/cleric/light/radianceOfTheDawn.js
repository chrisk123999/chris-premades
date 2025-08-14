import {activityUtils, genericUtils, itemUtils, templateUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.template) return;
    let darknessTemplates = workflow.template.parent.templates.filter(template => template.flags['chris-premades']?.template?.visibility?.magicalDarkness).filter(template => templateUtils.overlap(workflow.template, template));
    await genericUtils.deleteEmbeddedDocuments(workflow.template.parent, 'MeasuredTemplate', darknessTemplates.map(i => i.id));
}
async function added({trigger: {entity: item, actor}}) {
    let channelDivinity = itemUtils.getItemByIdentifier(actor, 'channelDivinity');
    if (!channelDivinity) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'use', {strict: true});
    if (!activity) return;
    let itemData = genericUtils.duplicate(item.toObject());
    itemData.system.activities[activity.id].consumption.targets[0].target = channelDivinity.id;
    let path = 'system.activities.' + activity.id + '.consumption.targets';
    await genericUtils.update(item, {[path]: itemData.system.activities[activity.id].consumption.targets});
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
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added
        }
    ],
};