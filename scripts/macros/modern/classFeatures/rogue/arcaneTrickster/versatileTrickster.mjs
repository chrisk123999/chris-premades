import {actorUtils, dialogUtils, documentUtils, queryUtils, summonUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function used({actor, data: {activity, targets}}) {
    if (documentUtils.getIdentifier(activity) !== 'trip' || documentUtils.getIdentifier(activity.item) !== 'cunning-strike') return;
    const hand = summonUtils.getSummonsByIdentifier('mageHand', {actor}).find(summon => summon.token);
    if (!hand) return;
    const maxSize = CONFIG.DND5E.actorSizes.lg.numerical;
    const candidates = tokenUtils.findNearby(hand.token, 5).filter(token => token.id !== targets[0]?.id && token.actor && actorUtils.getSize(token.actor) <= maxSize);
    if (!candidates.length) return;
    const selection = await dialogUtils.selectTargetDialog(activity.item.name, _loc('CHRISPREMADES.Macros.Modern.VersatileTrickster.Select'), candidates, {skipDeadAndUnconscious: false, userId: queryUtils.firstOwner(actor, true)});
    if (!selection?.result) return;
    await workflowUtils.syntheticActivityRoll(activity, [selection.result], {consumeUsage: false, consumeResources: false});
}
export const versatileTrickster = {
    name: 'Versatile Trickster',
    version: '2.0.0',
    rules: '2024',
    called: [
        {
            pass: 'actorAttackRiderUsed',
            macro: used,
            priority: 50
        }
    ]
};
