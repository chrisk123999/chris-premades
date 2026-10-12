import {actorUtils, automationUtils, documentUtils, effectUtils, Logging, tokenUtils, workflowUtils} from '../../proxy.mjs';
async function turnEnd({document: effect, token}) {
    const config = automationUtils.getGenericConfigValues(effect, 'chris-premades', 'saveToEndWhenFar', configKeys);
    const originActivity = effectUtils.getOriginActivitySync(effect);
    if (!originActivity) return;
    const originToken = actorUtils.getFirstToken(originActivity.actor);
    if (!originToken || tokenUtils.getDistance(originToken, token) <= Number(config.distance)) return;
    const activity = originActivity.item.system.activities.get(config.rollActivity);
    if (!activity) return Logging.addMacroWarning('CPR', documentUtils.getIdentifier(effect), 'Save activity not found.', {notify: 'warn'});
    const workflow = await workflowUtils.syntheticActivityRoll(activity, [token]);
    if (!workflow || workflow.failedSaves.size) return;
    await documentUtils.deleteDocument(effect);
}
/**
 * Rolls a save at the end of the creature's turn while it is far from the effect's source.
 * Bound on an effect. Fires on `actorTurnEnd`.
 * A successful save removes the effect.
 *
 * Config:
 * - `distance`: the save is offered only when the creature is farther than this from the effect's source.
 * - `rollActivity`: save activity on the source item. A success removes this effect.
 */
export const saveToEndWhenFar = {
    rules: 'all',
    version: '2.0.4',
    category: 'mechanics',
    generic: true,
    documents: ['activeeffect'],
    combat: [
        {
            pass: 'actorTurnEnd',
            macro: turnEnd,
            priority: 50
        }
    ],
    genericConfig: {
        distance: {
            default: 30,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Distance',
            hint: 'CHRISPREMADES.Macros.Generic.SaveToEndWhenFar.DistanceHint'
        },
        rollActivity: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.RollActivity',
            hint: 'CHRISPREMADES.Macros.Generic.SaveToEndWhenFar.RollActivityHint'
        }
    }
};
const configKeys = Object.keys(saveToEndWhenFar.genericConfig);
