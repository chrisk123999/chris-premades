import {activityUtils, actorUtils, combatUtils, dialogUtils, genericUtils, itemUtils, socketUtils, workflowUtils} from '../../../../../utils.js';
import {bardicInspiration} from '../bardicInspiration.js';
async function early({trigger, workflow}) {
    let maxTargets = Math.max(1, workflow.actor.system.abilities.cha.mod);
    if (workflow.targets.size <= maxTargets) return;
    let selection = await dialogUtils.selectTargetDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.MantleOfInspiration.Targets', {maxTargets}), Array.from(workflow.targets), {type: 'multiple', maxAmount: maxTargets, skipDeadAndUnconscious: false});
    if (!selection) {
        selection = Array.from(workflow.targets).slice(0, maxTargets);
    } else {
        selection = selection[0];
    }
    await workflowUtils.updateTargets(workflow, selection);
}
async function use({trigger, workflow}) {
    await Promise.all(workflow.targets.map(async token => {
        if (actorUtils.hasUsedReaction(token.actor)) return;
        let selection = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.MantleOfInspiration.Reaction', {userId: socketUtils.firstOwner(token.actor, true)});
        if (!selection) return;
        if (combatUtils.inCombat()) await actorUtils.setReactionUsed(token.actor);
    }));
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['use'], 'bardicInspiration');
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let scaleIdentifier = itemUtils.getConfig(item, 'scaleIdentifier');
    if (item.actor.system.scale[classIdentifier]?.[scaleIdentifier]) return;
    if (item.actor.system.scale[classIdentifier]?.['inspiration']) {
        await itemUtils.setConfig(item, 'scaleIdentifier', 'inspiration');
        await genericUtils.update(item, 'system.activities.healManOfInclass.healing.bonus', 'scale.' + classIdentifier + '.inspiration.die * 2');
    }
    await itemUtils.fixScales(item);
}
export let mantleOfInspiration = {
    name: 'Mantle of Inspiration',
    version: '1.1.40',
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