import {constants, itemUtils, actorUtils, tokenUtils, activityUtils, dialogUtils, genericUtils, socketUtils, workflowUtils} from '../../utils.js';
async function attacked(workflow, itemIdentifier, activityIdentifier, {canSee = true, reaction = true, distance = 30, canUse = true, attacker = true, dispositionType = 'ally', dialogType = 'use'} = {}) {
    if (!workflow.token) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    for (let token of workflow.token.scene.tokens) {
        if (dispositionType === 'ally' && token.disposition === workflow.token.document.disposition) continue;
        if (dispositionType === 'enemy' && token.disposition != workflow.token.document.disposition) continue;
        let item = itemUtils.getItemByIdentifier(token.actor, itemIdentifier);
        if (!item) continue;
        if (reaction && actorUtils.hasUsedReaction(token.actor)) continue;
        if (distance && tokenUtils.getDistance(workflow.token, token) > distance) continue;
        if (canSee && !tokenUtils.canSee(workflow.token, token)) continue;
        let activity = activityUtils.getActivityByIdentifier(item, activityIdentifier);
        if (!activity) continue;
        if (canUse && !activityUtils.canUse(activity)) continue;
        let selection;
        switch (dialogType) {
            case 'attackRoll': selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Missed', {attackTotal: workflow.attackTotal, itemName: item.name}), {userId: socketUtils.firstOwner(item.parent, true)}); break;
            case 'use': selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), {userId: socketUtils.firstOwner(item.parent, true)}); break;
        }
        if (!selection) continue;
        let target = attacker ? workflow.token : workflow.targets.first();
        await workflowUtils.syntheticActivityRoll(activity, [target], {consumeResources: true, consumeUsage: true});
        return item;
    }
}
export let thirdPartyUtils = {
    attacked
};