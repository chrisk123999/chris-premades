import {automationUtils, documentUtils, Logging, rollUtils, tokenUtils} from '../../proxy.mjs';
import {resolveCastFormula} from './multiSingleTarget.mjs';
async function use({document, workflow}) {
    if (!workflow.token) return Logging.addMacroWarning('CPR', documentUtils.getIdentifier(workflow.item), 'No token on the scene.');
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'teleport', configKeys);
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation', {source: 'chris-premades', identifier: 'teleport'});
    const rolledRange = config.rangeFromRoll ? workflow.utilityRolls?.[0]?.total : undefined;
    const configRange = config.range ? rollUtils.rollDiceSync(resolveCastFormula(String(config.range), workflow.castData), {document: workflow.activity}).total : undefined;
    const range = rolledRange || configRange || workflow.activity.range.value;
    if (config.targets !== 'failedSaves') {
        await tokenUtils.teleportToken(workflow.token.document, {animation, options, range, requireSight: config.requireSight});
        return;
    }
    for (const target of workflow.failedSaves) {
        await tokenUtils.teleportToken(target.document, {animation, options, range, requireSight: config.requireSight, centerpoint: workflow.token.center});
    }
}
/**
 * Teleports the user, or each target that failed its save, once the roll finishes.
 * Bound on an activity. Fires on `activityRollFinished`.
 *
 * Config:
 * - `targets`: teleport the user, or each target that failed its save. The user picks every destination, measured from the user.
 * - `range`: maximum teleport distance formula. `@item.level` and `@scaling` use the cast level and upcast levels. Leave blank to use the activity's own range.
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
        targets: {
            default: 'self',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Teleport.Targets',
            hint: 'CHRISPREMADES.Macros.Generic.Teleport.TargetsHint',
            options: [
                {value: 'self', label: 'CHRISPREMADES.Macros.Generic.Teleport.Self'},
                {value: 'failedSaves', label: 'CHRISPREMADES.Macros.Generic.Teleport.FailedSaves'}
            ]
        },
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
