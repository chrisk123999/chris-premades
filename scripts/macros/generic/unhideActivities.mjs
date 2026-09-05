import {automationUtils, documentUtils, effectUtils, itemUtils} from '../../proxy.mjs';
async function created({document}) {
    const activity = await effectUtils.getOriginActivity(document);
    if (!activity) return;
    const activityIds = automationUtils.getGenericConfigValue(document, 'chris-premades', 'unhideActivities', 'activityIds');
    const favorite = automationUtils.getGenericConfigValue(document, 'chris-premades', 'unhideActivities', 'favorite');
    if (!activityIds.length) return;
    const effect = await itemUtils.unhideActivities(activity.item, activityIds, {favorite, ids: true});
    await documentUtils.makeDependent(document, [effect]);
}
export const unhideActivities = {
    rules: 'all',
    version: '2.0.3',
    category: 'mechanics',
    generic: true,
    documents: ['activeeffect'],
    effect: [
        {
            pass: 'created',
            macro: created,
            priority: 100
        }
    ],
    genericConfig: {
        activityIds: {
            default: [],
            type: 'selectActivities',
            label: 'CHRISPREMADES.Config.Activities',
            hint: ''
        },
        favorite: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Config.FavoriteActivities',
            hint: ''
        }
    }
};