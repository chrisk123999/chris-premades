import {itemUtils, actorUtils, tokenUtils, activityUtils, dialogUtils, genericUtils, socketUtils, workflowUtils} from '../../utils.js';
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
async function damaged(workflow, ditem, targetToken, itemIdentifier, activityIdentifier, {canSee = true, reaction = true, distance = 30, canUse = true, dispositionType = 'enemy', dialogType = 'use', checkHits = true, preventZeroHP = false} = {}) {
    if (!workflow.token) return;
    for (let token of targetToken.scene.tokens) {
        if (checkHits && !workflow.hitTargets.has(targetToken)) return;
        if (dispositionType === 'ally' && token.disposition === targetToken.document.disposition) continue;
        if (dispositionType === 'enemy' && token.disposition != targetToken.document.disposition) continue;
        let item = itemUtils.getItemByIdentifier(token.actor, itemIdentifier);
        if (!item) continue;
        if (reaction && actorUtils.hasUsedReaction(token.actor)) continue;
        if (distance && tokenUtils.getDistance(targetToken, token) > distance) continue;
        if (canSee && !tokenUtils.canSee(targetToken, token)) continue;
        if (preventZeroHP && ditem.newHP != 0 || ditem.oldHP === 0) continue;
        let activity = activityUtils.getActivityByIdentifier(item, activityIdentifier);
        if (!activity) continue;
        if (canUse && !activityUtils.canUse(activity)) continue;
        let selection;
        switch (dialogType) {
            case 'use': selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Generic.ProtectWithItem', {item: item.name, token: targetToken.name}), {userId: socketUtils.firstOwner(item.parent, true)}); break;
        }
        if (!selection) continue;
        let targetWorkflow = await workflowUtils.syntheticActivityRoll(activity, [targetToken], {consumeResources: true, consumeUsage: true});
        if (preventZeroHP) {
            workflowUtils.preventDeath(ditem);
        } else {
            workflowUtils.modifyDamageAppliedFlat(ditem, -targetWorkflow.utilityRolls[0].total);
        }
    }
}
export let thirdPartyUtils = {
    attacked,
    damaged
};