import {automationUtils, documentUtils, Logging, tokenUtils} from '../../proxy.mjs';
async function use({document, workflow}) {
    if (!workflow.token) return Logging.addMacroWarning('CPR', documentUtils.getIdentifier(workflow.item), 'No token on the scene.');
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'teleport', configKeys);
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'teleport'});
    const rolledRange = config.rangeFromRoll ? workflow.utilityRolls?.[0]?.total : undefined;
    const range = rolledRange || config.range || workflow.activity.range.value;
    await tokenUtils.teleportToken(workflow.token.document, {animation, options, range, requireSight: config.requireSight});
}
/**
 * Teleports the user once the roll finishes.
 * Bound on an activity. Fires on `activityRollFinished`.
 *
 * Config:
 * - `range`: maximum teleport distance. Leave blank to use the activity's own range.
 * - `rangeFromRoll`: use the activity's utility roll total as the maximum distance. Falls back to `range`.
 * - `requireSight`: only allow spaces the user can see. Turn off for teleports that need no sight.
 * - `animation`: played during the teleport.
 */
export const teleport = {
    rules: 'all',
    version: '2.1.0',
    category: 'movement',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        }
    ],
    genericConfig: {
        range: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.RangeHint'
        },
        rangeFromRoll: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Teleport.RangeFromRoll',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.RangeFromRollHint'
        },
        requireSight: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Teleport.RequireSight',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.RequireSightHint'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'mistyStep'
            },
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            category: 'animations',
            label: 'CHRISPREMADES.Config.Animation'
        }
    }
};
const configKeys = Object.keys(teleport.genericConfig);
