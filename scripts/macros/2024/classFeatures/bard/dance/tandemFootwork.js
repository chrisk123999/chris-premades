import {activityUtils, genericUtils, itemUtils} from '../../../../../utils.js';
import {bardicInspiration} from '../bardicInspiration.js';
async function early({trigger, workflow}) {
    if (!workflow.token) return;
    await genericUtils.updateTargets(Array.from(workflow.targets).concat(workflow.token));
}
async function added({trigger: {entity: item, identifier, actor}}) {
    let bardicInspiration = itemUtils.getItemByIdentifier(actor, 'bardicInspiration');
    if (!bardicInspiration) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'use');
    if (!activity) return;
    let path = 'system.activities.' + activity.id + '.consumption.targets';
    await genericUtils.update(item, {[path]: [
        {
            type: 'itemUses',
            value: 1,
            target: bardicInspiration.id,
            scaling: {
                mode: undefined,
                formula: undefined
            }
        }
    ]});
}
async function updateScales(origItem, newItemData) {
    let { classIdentifier=null, scaleIdentifier=null } = genericUtils.getValidScaleIdentifier(origItem.actor, newItemData, bardicInspiration.scaleAliases, 'bard');
    if (!scaleIdentifier) return;
    genericUtils.setProperty(newItemData, 'flags.chris-premades.config.scaleIdentifier', scaleIdentifier);
    genericUtils.setProperty(newItemData, 'effects.0.changes.0.value', `@scale.${classIdentifier}.${scaleIdentifier}.die`);
}
export let tandemFootwork = {
    name: 'Tandem Footwork',
    version: '1.1.36',
    rules: 'modern',
    early: updateScales,
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
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
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'bard',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'bardic-inspiration',
            category: 'homebrew',
            homebrew: true
        }
    ],
    scales: bardicInspiration.scales
};