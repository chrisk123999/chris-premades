import {activityUtils, effectUtils, genericUtils, itemUtils, rollUtils} from '../../../../../utils.js';
import {bardicInspiration} from '../bardicInspiration.js';
async function early({trigger, workflow}) {
    if (!workflow.token) return;
    await genericUtils.updateTargets(Array.from(workflow.targets).concat(workflow.token));
}
async function use({trigger, workflow}) {
    let classIdentifier = itemUtils.getConfig(workflow.item, 'classIdentifier');
    let scaleIdentifier = itemUtils.getConfig(workflow.item, 'scaleIdentifier');
    let formula = workflow.actor.system.scale[classIdentifier][scaleIdentifier].formula;
    let roll = await rollUtils.rollDice(formula, {chatMessage: true});
    let sourceEffect = workflow.item.effects.contents?.[0];
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    effectData.changes[0].value = roll.roll.total;
    await Promise.all(workflow.targets.map(async token => await effectUtils.createEffect(token.actor, effectData)));
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
    version: '1.3.8',
    rules: 'modern',
    early: updateScales,
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