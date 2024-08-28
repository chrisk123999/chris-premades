import {actorUtils, animationUtils, dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    let targets = tokenUtils.findNearby(workflow.token, 30, 'ally', {includeToken: true, includeIncapacitated: true});
    targets = targets.filter(i => !['undead', 'construct'].includes(actorUtils.typeOrRace(i.actor)));
    targets = targets.filter(i => i.actor.system.attributes.hp.value < Math.floor(i.actor.system.attributes.hp.max / 2));
    if (!targets.length) return;
    let classLevels = workflow.actor.classes.cleric?.system.levels;
    if (!classLevels) return;
    let maxAmount = classLevels * 5;
    let selection = await dialogUtils.selectTargetDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.PreserveLife.Select', {maxAmount}), targets, {
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
export let preserveLife = {
    name: 'Channel Divinity: Preserve Life',
    version: '0.12.40',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ]
};