import {constants, itemUtils, actorUtils, tokenUtils, activityUtils, dialogUtils, genericUtils, socketUtils, workflowUtils} from '../../utils.js';
async function attack(workflow, itemIdentifier, activityIdentifier, {canSee = true, reaction = true, distance = 30, canUse = true, attacker = true} = {}) {
    if (!workflow.token) return;
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    for (let token of workflow.token.scene.tokens) {
        if (token.disposition === workflow.token.document.disposition) continue;
        let item = itemUtils.getItemByIdentifier(token.actor, itemIdentifier);
        if (!item) continue;
        if (reaction && actorUtils.hasUsedReaction(token.actor)) continue;
        if (distance && tokenUtils.getDistance(workflow.token, token) > distance) continue;
        if (canSee && !tokenUtils.canSee(workflow.token, token)) continue;
        let activity = activityUtils.getActivityByIdentifier(item, activityIdentifier);
        if (!activity) continue;
        if (canUse && !activityUtils.canUse(activity)) continue;
        let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), {userId: socketUtils.firstOwner(item.parent, true)});
        if (!selection) continue;
        let target = attacker ? workflow.token : workflow.targets.first();
        await workflowUtils.syntheticActivityRoll(activity, [target], {consumeResources: true, consumeUsage: true});
        return;
    }
}
export let thirdPartyUtils = {
    attack
};