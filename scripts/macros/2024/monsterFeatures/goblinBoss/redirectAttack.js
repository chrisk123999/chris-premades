import {actorUtils, dialogUtils, genericUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function attacked({trigger: {token: target, entity: item}, workflow}) {
    if (!workflow.targets.size || !workflow.token) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    if (actorUtils.hasUsedReaction(target.actor)) return;
    let nearby = tokenUtils.findNearby(target, 5, 'all', {includeIncapacitated: true}).filter(i => i.document.id != workflow.token.document.id && [1, 2].includes(actorUtils.getSize(i.actor)));
    if (!nearby.length) return;
    let selection = await dialogUtils.selectTargetDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), nearby, {skipDeadAndUnconscious: false, userId: socketUtils.firstOwner(item.actor, true)});
    if (!selection) return;
    let changes = [
        {
            document: workflow.targets.first().document,
            x: selection[0].x,
            y: selection[0].y
        },
        {
            document: selection[0].document,
            x: workflow.targets.first().document.x,
            y: workflow.targets.first().document.y
        }
    ];
    await Promise.all(changes.map(async change => {
        await genericUtils.update(change.document, {x: change.x, y: change.y});
    }));
    await workflowUtils.updateTargets(workflow, [selection[0]]);
    await workflowUtils.syntheticItemRoll(item, [selection[0]]);
}
export let goblinBossRedirectAttack = {
    name: 'Redirect Attack',
    version: '1.3.130',
    rules: 'modern',
    monsters: [
        'Goblin Boss'
    ],
    midi: {
        actor: [
            {
                pass: 'targetPreambleComplete',
                macro: attacked,
                priority: 50
            }
        ]
    }
};