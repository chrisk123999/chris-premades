import {activityUtils, actorUtils, automationUtils, constants, documentUtils, Logging, rollUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
async function targeting({document: activity, token, workflow}) {
    const {sizeCheck, grappledOnly} = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'contestedCheck', ['sizeCheck', 'grappledOnly']);
    if ((!sizeCheck && !grappledOnly) || !token) return;
    const grappled = grappledOnly ? tokenUtils.getGrappled(token) : [];
    const invalid = [];
    for (const target of workflow.targets.documents) {
        if (grappledOnly && !grappled.some(other => other.id === target.id)) invalid.push(target);
        else if (sizeCheck && target.actor && !await tokenUtils.grappleShoveSizeCheck(token, target, sizeCheck, false)) invalid.push(target);
    }
    if (!invalid.length) return;
    if (grappledOnly && invalid.length === workflow.targets.count) {
        Logging.addMacroWarning('CPR', documentUtils.getIdentifier(activity.item), 'No target is grappled by the user.', {notify: 'warn'});
        return true;
    }
    await workflowUtils.removeTargets(workflow, invalid);
}
async function contest({document: activity, actor, workflow}) {
    const targets = workflow.targets.documents.filter(target => target.actor);
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
    await workflowUtils.setActivity(workflow, activityUtils.getCheckDCModifiedActivityData(workflow.activity, roll.total));
}
/**
 * Rolls a skill or ability check for the user and sets the activity's check DC to the result, so targets contest it
 * with the activity's own check. Declining the roll cancels the use.
 */
export const contestedCheck = {
    rules: 'all',
    version: '2.1.9',
    category: 'rolls',
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
            hint: 'CHRISPREMADES.Macros.Generic.ContestedCheck.SourceSkills.Hint',
            get options() { return constants.skillOptions; }
        },
        sourceAbilities: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.Abilities',
            hint: 'CHRISPREMADES.Macros.Generic.ContestedCheck.SourceAbilities.Hint',
            get options() { return constants.abilityOptions; }
        },
        advantageMaxSize: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.MaxSize',
            hint: 'CHRISPREMADES.Macros.Generic.ContestedCheck.AdvantageMaxSize.Hint',
            get options() { return [{value: '', label: 'CHRISPREMADES.Config.None'}, ...constants.sizeOptions]; }
        },
        sizeCheck: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ContestedCheck.SizeCheck.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ContestedCheck.SizeCheck.Hint',
            options: [
                {value: '', label: 'CHRISPREMADES.Config.None'},
                {value: 'grapple', label: 'CHRISPREMADES.Macros.Generic.ContestedCheck.Grapple'},
                {value: 'shove-push', label: 'CHRISPREMADES.Macros.Generic.ContestedCheck.ShovePush'},
                {value: 'shove-prone', label: 'CHRISPREMADES.Macros.Generic.ContestedCheck.ShoveProne'}
            ]
        },
        grappledOnly: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ContestedCheck.GrappledOnly.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ContestedCheck.GrappledOnly.Hint'
        }
    }
};
const configKeys = Object.keys(contestedCheck.genericConfig);
