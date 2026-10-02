import {activityUtils, actorUtils, automationUtils, constants, rollUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
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
    if (!key) return;
    const maxSize = CONFIG.DND5E.actorSizes[config.advantageMaxSize]?.numerical;
    const advantage = maxSize !== undefined && targets.every(target => actorUtils.getSize(target.actor) <= maxSize);
    const roll = await rollUtils.requestRoll(actor, request, key, {advantage});
    if (!roll) {
        workflow.aborted = true;
        return true;
    }
    workflowUtils.setActivity(workflow, activityUtils.getCheckDCModifiedActivityData(workflow.activity, roll.total));
}
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
