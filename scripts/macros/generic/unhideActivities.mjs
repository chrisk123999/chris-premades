import {automationUtils, effectUtils} from '../../proxy.mjs';
async function created({document}) {
    const activity = await effectUtils.getOriginActivity(document);
    if (!activity) return;
    const activityIds = automationUtils.getGenericConfigValue(document, 'chris-premades', 'unhideActivities', 'activityIds');
    const favorite = automationUtils.getGenericConfigValue(document, 'chris-premades', 'unhideActivities', 'favorite');
    const identifiers = activityIds.map(id => activity.item.system.activities.get(id)?.identifier).filter(Boolean);
    if (!identifiers.length) return;
    const all = document.flags.cat?.unhideActivities ?? [];
    all.push(...identifiers);
    document.updateSource({
        'flags.cat.unhideActivities': all,
        'flags.cat.favoriteActivities': favorite
    });
}
/**
 * Unhides activities on the effect's origin item while the effect exists.
 * Bound on an effect. Fires on `preCreated`.
 *
 * Config:
 * - `activityIds`: activities to unhide.
 * - `favorite`: favorite the unhidden activities.
 */
export const unhideActivities = {
    rules: 'all',
    version: '2.1.4',
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