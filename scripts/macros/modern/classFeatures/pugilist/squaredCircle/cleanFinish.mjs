import {actorUtils, dialogUtils, documentUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function turnEnd({document: item, token}) {
    const owner = actorUtils.getFirstToken(item.actor);
    if (!owner || !token?.actor || !tokenUtils.getGrappled(owner).includes(token)) return;
    if (!item.system.uses.value || actorUtils.hasUsedReaction(item.actor)) return;
    if (!await dialogUtils.confirmUseItem(item, {userId: queryUtils.firstOwner(item.actor, true)})) return;
    const dazed = actorUtils.getEffects(token.actor).find(effect => documentUtils.getIdentifier(effect) === 'cleanFinish');
    const finishing = dazed && actorUtils.isBloodied(token.actor);
    const activity = itemUtils.getActivityByIdentifier(item, finishing ? 'finish' : 'clean-finish');
    if (!activity) return;
    const workflow = await workflowUtils.completeActivityUse(activity, [token]);
    if (!finishing || !workflow?.failedSaves.count) return;
    const hp = token.actor.system.attributes.hp;
    await workflowUtils.applyDamage([token], hp.value + (hp.temp ?? 0), 'none');
    await documentUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
}
export const cleanFinish = {
    name: 'Clean Finish',
    version: '2.1.11',
    rules: '2024',
    combat: [
        {
            pass: 'sceneTurnEnd',
            macro: turnEnd,
            priority: 50
        }
    ]
};
