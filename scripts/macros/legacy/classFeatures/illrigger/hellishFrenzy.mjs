import {activityUtils, actorUtils, dialogUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
import {getSeals} from './balefulInterdict.mjs';
async function turnStart({document: item}) {
    if (item.actor.statuses.has('incapacitated')) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'use');
    const interdict = actorUtils.getItemByIdentifier(item.actor, 'baleful-interdict');
    const token = actorUtils.getFirstToken(item.actor);
    if (!activity || !interdict || !token || !activityUtils.checkCosts(activity)) return;
    if (!token.parent.tokens.some(other => other.actor && getSeals(other.actor, interdict).length && tokenUtils.isWithinDistance(token, other, 30))) return;
    if (!await dialogUtils.confirmUseItem(item, {userId: queryUtils.firstOwner(item.actor, true)})) return;
    await workflowUtils.completeActivityUse(activity, []);
}
export const interdictBoonHellishFrenzy = {
    name: 'Interdict Boons: Hellish Frenzy',
    version: '2.1.10',
    rules: '2014',
    combat: [
        {
            pass: 'actorTurnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};
