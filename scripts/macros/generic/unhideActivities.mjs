import {automationUtils, effectUtils} from '../../proxy.mjs';
async function created({document}) {
    const activity = await effectUtils.getOriginActivity(document);
    if (!activity) return;
    const activityIds = automationUtils.getGenericConfigValue(document, 'chris-premades', 'unhideActivities', 'activityIds');
    const favorite = automationUtils.getGenericConfigValue(document, 'chris-premades', 'unhideActivities', 'favorite');
    const identifiers = activityIds.map(id => activity.item.system.activities.get(id)?.identifier).filter(Boolean);
    if (!identifiers.length) return;
    const all = [...(document.flags.cat?.unhideActivities ?? []), ...identifiers];
    document.updateSource({
        'flags.cat.unhideActivities': all,
        'flags.cat.favoriteActivities': favorite
    });
}
/**
 * Unhides activities on the effect's origin item while the effect exists. The activities are stored on the effect by
 * identifier when it is created.
 */
export const unhideActivities = {
    rules: 'all',
    version: '2.1.11',
    category: 'mechanics',
    generic: true,
    documents: ['activeeffect'],
    effect: [
        {
            pass: 'preCreated',
            macro: created,
            priority: 100
        }
    ],
    genericConfig: {
        activityIds: {
            default: [],
            type: 'selectActivities',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Activities',
            hint: 'CHRISPREMADES.Macros.Generic.UnhideActivities.ActivityIds.Hint'
        },
        favorite: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.UnhideActivities.FavoriteActivities',
            hint: 'CHRISPREMADES.Macros.Generic.UnhideActivities.Favorite.Hint'
        }
    }
};