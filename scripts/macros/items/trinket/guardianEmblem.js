import {actorUtils, combatUtils, constants, dialogUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function attack({trigger, workflow}) {
    if (!workflow.targets.size || !workflow.isCritical || !workflow.item) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let target = workflow.targets.first();
    let nearbyShields = tokenUtils.findNearby(target, 30, 'ally', {includeToken: true}).filter(i => {
        let item = itemUtils.getItemByIdentifier(i.actor, 'guardianEmblem');
        if (!item) return;
        if (!item.system.uses.value) return;
        if (!itemUtils.getEquipmentState(item)) return;
        if (combatUtils.inCombat() && actorUtils.hasUsedReaction(i.actor)) return;
        return true;
    });
    if (!nearbyShields.length) return;
    for (let i of nearbyShields) {
        let item = itemUtils.getItemByIdentifier(i.actor, 'guardianEmblem');
        let userId = socketUtils.firstOwner(i.document, true);
        let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.GuardianEmblem.Protect', {item: item.name, name: i.actor.name}), {userId: userId});
        if (!selection) continue;
        //await socketUtils.remoteRollItem(item, undefined, undefined, userId);
        await workflowUtils.syntheticItemRoll(item, [target], {config: {consumeUsage: true}});
        workflow.isCritical = false;
        break;
    }
}
export let guardianEmblem = {
    name: 'Guardian Emblem',
    version: '0.12.53',
    midi: {
        actor: [
            {
                pass: 'sceneAttackRollComplete',
                macro: attack,
                priority: 100
            }
        ]
    }
};