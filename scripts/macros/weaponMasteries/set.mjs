import {actorUtils, dialogUtils, distanceUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
function wasOutsideReach(wielder, token, origin, reach) {
    const offset = {x: origin.x - token.x, y: origin.y - token.y};
    const center = token.getCenterPoint();
    const distance = distanceUtils.measureDistance(token.parent, [wielder.getCenterPoint(), {x: center.x + offset.x, y: center.y + offset.y}]);
    const sizes = distanceUtils.fromGridSpaces(token.parent, ((wielder.width - 1) + (token.width - 1)) / 2);
    return !distanceUtils.isWithinRange(token.parent, distance - sizes, reach);
}
async function moved({document: item, token, origin, action}) {
    if (!origin || action === 'catForce' || !item.system.equipped) return;
    const wielder = actorUtils.getFirstToken(item.actor);
    if (!wielder || wielder === token || !tokenUtils.isEnemy(wielder, token) || actorUtils.hasUsedReaction(item.actor)) return;
    const reach = itemUtils.getRange(item).reach ?? 5;
    if (!tokenUtils.isWithinDistance(wielder, token, reach) || !wasOutsideReach(wielder, token, origin, reach)) return;
    const activity = item.system.activities.getByType('attack')[0];
    if (!activity) return;
    const userId = queryUtils.firstOwner(item.actor, true);
    if (!await dialogUtils.confirm(itemUtils.getMasteryLabel('set'), _loc('CHRISPREMADES.WeaponMasteries.Set.Prompt', {target: token.name, weapon: item.name}), {userId})) return;
    await actorUtils.setReactionUsed(item.actor);
    await workflowUtils.syntheticActivityRoll(activity, [token], {userId, consumeUsage: false});
}
export const setMastery = {
    label: 'CHRISPREMADES.WeaponMasteries.Set.Label',
    move: [
        {pass: 'nearbyMoved', macro: moved, priority: 50}
    ]
};
