import {activityUtils, effectUtils, genericUtils, itemUtils, rollUtils, workflowUtils} from '../../../../../utils.js';
import {bardicInspiration} from '../bardicInspiration.js';
async function early({trigger, workflow}) {
    if (!workflow.token) return;
    await workflowUtils.updateTargets(Array.from(workflow.targets).concat(workflow.token));
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
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['use'], 'bardicInspiration');
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    if (item.actor.system.scale[classIdentifier]?.[scaleIdentifier]) return;
    if (item.actor.system.scale[classIdentifier]?.['inspiration']) {
        await itemUtils.setConfig(item, 'scaleIdentifier', 'inspiration');
        await genericUtils.update(item, 'effects.0.changes.0.value', 'scale.' + classIdentifier + '.inspiration.die');
    }
    await itemUtils.fixScales(item);
}
export let tandemFootwork = {
    name: 'Tandem Footwork',
    version: '1.3.8',
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