import {activityUtils, actorUtils, dialogUtils, itemUtils, Logging, queryUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function spent({document: item, actor, token}) {
    if (item.actor === actor || item.actor.system.attributes.inspiration) return;
    const targetToken = actorUtils.getFirstToken(item.actor);
    if (!targetToken) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'tireless-reveler');
    if (!activity) return Logging.addMacroWarning('CPR', 'tireless-reveler', 'Missing the tireless-reveler activity.', {notify: 'warn'});
    if (!activityUtils.checkCosts(activity)) return;
    if (!tokenUtils.canSee(targetToken, token)) return;
    if (!await dialogUtils.confirmUseItem(item, {userId: queryUtils.firstOwner(item.actor, true)})) return;
    await workflowUtils.completeActivityUse(activity, [targetToken]);
}
export const tirelessReveler = {
    name: 'Tireless Reveler',
    version: '2.1.4',
    rules: '2024',
    called: [
        {
            pass: 'nearbyHeroicInspirationSpent',
            macro: spent,
            priority: 50,
            configDistance: 'distance',
            dispositions: ['ally']
        }
    ],
    config: {
        distance: {
            default: 60,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Distance'
        }
    }
};
