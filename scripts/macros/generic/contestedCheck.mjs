import {activityUtils, actorUtils, automationUtils, constants, documentUtils, Logging, rollUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
async function targeting({document: activity, token, workflow}) {
    const sizeCheck = automationUtils.getGenericConfigValue(activity, 'chris-premades', 'contestedCheck', 'sizeCheck');
    if (!sizeCheck || !token) return;
    const invalid = [];
    for (const target of workflow.targets) {
        if (target.actor && !await tokenUtils.grappleShoveSizeCheck(token, target.document, sizeCheck, false)) invalid.push(target);
    }
    if (invalid.length) await workflowUtils.removeTargets(workflow, invalid);
}
async function contest({document: activity, actor, workflow}) {
    const targets = Array.from(workflow.targets).filter(target => target.actor);
    if (!targets.length) return;
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'contestedCheck', configKeys);
    const request = config.sourceSkills.length ? 'skill' : 'check';
    const key = config.sourceSkills.length ? actorUtils.getBestSkill(actor, config.sourceSkills) : actorUtils.getBestAbility(actor, config.sourceAbilities);
    if (!key) return Logging.addMacroWarning('CPR', documentUtils.getIdentifier(activity.item), 'No source skill or ability configured.', {notify: 'warn'});
    const maxSize = CONFIG.DND5E.actorSizes[config.advantageMaxSize]?.numerical;
    const advantage = maxSize !== undefined && targets.every(target => actorUtils.getSize(target.actor) <= maxSize);
    const roll = await rollUtils.requestRoll(actor, request, key, {advantage});
    if (!roll) {
        workflow.aborted = true;
        return true;
    }
    workflowUtils.setActivity(workflow, activityUtils.getCheckDCModifiedActivityData(workflow.activity, roll.total));
}
/**
 * Rolls a check for the user and sets the activity's check DC to the result.
 * Bound on an activity. Fires on `activityTargeting` and `activityPreambleComplete`.
 *
 * Config:
 * - `sourceSkills`: skills the user contests with. The highest total is rolled.
 * - `sourceAbilities`: ability checks the user contests with when no skill is set. The highest modifier is rolled.
 * - `advantageMaxSize`: roll with advantage when every target is this size or smaller.
 * - `sizeCheck`: remove targets that are too large or immune for this grapple or shove.
 */
export const contestedCheck = {
    rules: 'all',
    version: '2.0.0',
    category: 'utility',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityTargeting',
            macro: targeting,
            priority: 50
        },
        {
            pass: 'activityPreambleComplete',
            macro: contest,
            priority: 25
        }
    ],
    genericConfig: {
        sourceSkills: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Skills',
            hint: 'CHRISPREMADES.Macros.Generic.ContestedCheck.SourceSkillsHint',
            get options() { return constants.skillOptions; }
        },
        sourceAbilities: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Abilities',
            hint: 'CHRISPREMADES.Macros.Generic.ContestedCheck.SourceAbilitiesHint',
            get options() { return constants.abilityOptions; }
        },
        advantageMaxSize: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.MaxSize',
            hint: 'CHRISPREMADES.Macros.Generic.ContestedCheck.AdvantageMaxSizeHint',
            get options() { return [{value: '', label: 'CHRISPREMADES.Config.None'}, ...constants.sizeOptions]; }
        },
        sizeCheck: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ContestedCheck.SizeCheck',
            hint: 'CHRISPREMADES.Macros.Generic.ContestedCheck.SizeCheckHint',
            options: [
                {value: '', label: 'CHRISPREMADES.Config.None'},
                {value: 'grapple', label: 'CHRISPREMADES.Macros.Generic.ContestedCheck.Grapple'},
                {value: 'shove-push', label: 'CHRISPREMADES.Macros.Generic.ContestedCheck.ShovePush'},
                {value: 'shove-prone', label: 'CHRISPREMADES.Macros.Generic.ContestedCheck.ShoveProne'}
            ]
        }
    }
};
const configKeys = Object.keys(contestedCheck.genericConfig);
