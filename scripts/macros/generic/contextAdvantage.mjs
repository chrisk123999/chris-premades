import {activityUtils, automationUtils, constants, dialogUtils, itemUtils, queryUtils, workflowUtils} from '../../proxy.mjs';
function getSettings({actor, config, document, options, saveId, skillId, toolId}) {
    if (config.advantage || options?.advantage || !itemUtils.getEquipmentState(document)) return;
    const settings = automationUtils.getGenericConfigValues(document, 'chris-premades', 'contextAdvantage', ['check', 'save', 'skill', 'tool', 'statuses', 'label', 'rollActivity']);
    if (actor.statuses.some(status => settings.statuses.includes(status))) return;
    const matches = saveId ? settings.save.includes(saveId) : settings.check.includes(config.ability) || settings.skill.includes(skillId) || settings.tool.includes(toolId);
    if (matches) return settings;
}
function context(data) {
    const settings = getSettings(data);
    if (!settings || settings.rollActivity) return;
    return {label: settings.label ? _loc(settings.label, {name: data.document.name}) : data.document.name, type: 'advantage'};
}
async function situational(data) {
    const settings = getSettings(data);
    const activity = settings?.rollActivity ? data.document.system.activities?.get(settings.rollActivity) : undefined;
    if (!activity || !activityUtils.checkCosts(activity)) return;
    if (!await dialogUtils.confirmUseItem(data.document, {userId: queryUtils.firstOwner(data.actor, true)})) return;
    if (!await workflowUtils.completeActivityUse(activity, [])) return;
    data.options.advantage = true;
}
const contextPass = [
    {
        pass: 'actorContext',
        macro: context,
        priority: 50
    },
    {
        pass: 'actorSituational',
        macro: situational,
        priority: 50
    }
];
/**
 * Offers advantage as a roll option on the chosen ability checks, saving throws, skill checks and tool checks. An item
 * must be equipped, and attuned if it needs attunement. The option is not offered when the roll already has advantage.
 * With a roll activity set, the owner is asked before the roll instead and pays that activity's costs for advantage.
 */
export const contextAdvantage = {
    rules: 'all',
    version: '2.1.11',
    category: 'rolls',
    generic: true,
    documents: ['activeeffect', 'item'],
    check: contextPass,
    save: contextPass,
    skill: contextPass,
    tool: contextPass,
    genericConfig: {
        check: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ContextAdvantage.CheckAbilities',
            hint: 'CHRISPREMADES.Macros.Generic.ContextAdvantage.Check.Hint',
            get options() { return constants.abilityOptions; }
        },
        save: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ContextAdvantage.SaveAbilities',
            hint: 'CHRISPREMADES.Macros.Generic.ContextAdvantage.Save.Hint',
            get options() { return constants.abilityOptions; }
        },
        skill: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Skills',
            hint: 'CHRISPREMADES.Macros.Generic.ContextAdvantage.Skill.Hint',
            get options() { return constants.skillOptions; }
        },
        tool: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Tools',
            hint: 'CHRISPREMADES.Macros.Generic.ContextAdvantage.Tool.Hint',
            get options() { return constants.toolOptions; }
        },
        statuses: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.BlockingConditions',
            hint: 'CHRISPREMADES.Macros.Generic.ContextAdvantage.Statuses.Hint',
            get options() { return constants.statusOptions; }
        },
        label: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ContextAdvantage.Label.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ContextAdvantage.Label.Hint'
        },
        rollActivity: {
            default: '',
            type: 'selectActivity',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.RollActivity.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ContextAdvantage.RollActivity.Hint'
        }
    }
};
