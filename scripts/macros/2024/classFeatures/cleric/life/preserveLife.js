import {activityUtils, animationUtils, dialogUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function early({trigger, workflow}) {
    let targets = workflow.targets.filter(i => i.actor.system.attributes.hp.value < Math.floor(i.actor.system.attributes.hp.max / 2));
    if (workflow.actor.system.attributes.hp.value < Math.floor(workflow.actor.system.attributes.hp.max / 2)) targets.add(workflow.token);
    await workflowUtils.updateTargets(Array.from(targets));
}
async function use({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size) return;
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let classItem = workflow.actor.classes[classIdentifier];
    if (!classItem) return;
    let classLevels = classItem.system.levels;
    let maxAmount = classLevels * 5;
    let selection = await dialogUtils.selectTargetDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.PreserveLife.Select', {maxAmount}), workflow.targets, {
        type: 'selectAmount',
        maxAmount,
        skipDeadAndUnconscious: false
    });
    if (!selection?.length) return;
    selection = selection[0].filter(i => i.value);
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck();
    for (let {document: target, value} of selection) {
        let currHP = target.actor.system.attributes.hp.value;
        let halfHP = Math.floor(target.actor.system.attributes.hp.max / 2);
        await workflowUtils.applyDamage([target], Math.min(value, halfHP - currHP), 'healing');
        if (playAnimation) new Sequence().effect().atLocation(target).file('jb2a.cure_wounds.400px.blue').play();
    }
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
export let preserveLife = {
    name: 'Preserve Life',
    version: '1.2.13',
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
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        },
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'cleric',
            category: 'homebrew',
            homebrew: true
        }
    ]
};