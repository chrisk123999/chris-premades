import {actorUtils, constants, dialogUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';

async function attack({trigger, workflow}) {
    if (!workflow.targets.size || !workflow.item || !workflow.isCritical || !constants.attacks.includes(workflow.activity.actionType)) return;
    if (genericUtils.getIdentifier(workflow.item) === 'sentinelAtDeathsDoor') return;
    let nearbyTokens = tokenUtils.findNearby(workflow.targets.first(), 30, 'ally').filter(token => {
        if (actorUtils.hasUsedReaction(token.actor)) return;
        let sentinelAtDeathsDoor = itemUtils.getItemByIdentifier(token.actor, 'sentinelAtDeathsDoor');
        if (!sentinelAtDeathsDoor) return;
        if (!sentinelAtDeathsDoor.system?.uses?.value) return;
        return true;
    });
    if (!nearbyTokens.length) return;
    for (let token of nearbyTokens) {
        let item = itemUtils.getItemByIdentifier(token.actor, 'sentinelAtDeathsDoor');
        let target = workflow.targets.first()
        let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.SentinelAtDeathsDoor.Attack', {item: item.name, name: target.document.name}), {userId: socketUtils.firstOwner(token.actor, true)});
        if (!selection) continue;
        await workflowUtils.syntheticItemRoll(item, [target], {consumeResources: true, userId: socketUtils.firstOwner(token.actor, true)});
        workflow.isCritical = false;
        return;
    }
}

export let sentinelAtDeathsDoor = {
    name: 'Sentinel at Death\'s Door',
    version: '1.2.32',
    rules: 'legacy',
    midi: {
        actor: [
            {
                pass: 'sceneAttackRollComplete',
                macro: attack,
                priority: 250
            }
        ]
    }
}