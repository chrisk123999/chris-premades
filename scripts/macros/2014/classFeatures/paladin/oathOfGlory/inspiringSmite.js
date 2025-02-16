import {animationUtils, dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';

async function use({workflow}) {
    let targets = tokenUtils.findNearby(workflow.token, 30, 'ally', {includeToken: true});
    if (!targets.length) return;
    let classLevels = workflow.actor.classes.paladin?.system.levels;
    if (!classLevels) return;
    let rollFormula = '2d8[temphp] + ' + classLevels;
    let damageRoll = await new CONFIG.Dice.DamageRoll(rollFormula, {}, {type: 'temphp'}).evaluate();
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
        flavor: workflow.item.name
    });
    let selection = await dialogUtils.selectTargetDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.InspiringSmite.Select', {maxAmount: damageRoll.total}), targets, {
        type: 'selectAmount',
        maxAmount: damageRoll.total,
        skipDeadAndUnconscious: false
    });
    if (!selection?.length) return;
    selection = selection[0].filter(i => i.value);
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation') && animationUtils.jb2aCheck();
    for (let {document: target, value} of selection) {
        await workflowUtils.applyDamage([target], value, 'temphp');
        if (playAnimation) new Sequence().effect().atLocation(target).file('jb2a.cure_wounds.400px.blue').play();
    }
}
export let inspiringSmite = {
    name: 'Channel Divinity: Inspiring Smite',
    version: '1.1.0',
    hasAnimation: true,
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