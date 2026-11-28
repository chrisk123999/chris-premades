import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, Logging, queryUtils, rollUtils, workflowUtils} from '../../proxy.mjs';
function getConditions(activity, macroID, actor = activity.actor) {
    const settings = automationUtils.getGenericConfigValues(activity, 'chris-premades', macroID, configKeys);
    return actorUtils.getStatusSources(actor, settings.conditions);
}
function getTargetActor(config) {
    const targets = workflowUtils.getPreTargetingTargets(config);
    return targets.length === 1 ? targets[0].actor : undefined;
}
async function preChecks({activity, config, macroClass: {identifier}}) {
    if (workflowUtils.getWorkflowProperty(config.workflow, 'conditionGained')) return;
    const {affects, requireCondition} = automationUtils.getGenericConfigValues(activity, 'chris-premades', identifier, ['affects', 'requireCondition']);
    if (affects === 'target') {
        const targetActor = getTargetActor(config);
        if (!targetActor || !requireCondition || getConditions(activity, identifier, targetActor)?.length) return;
        Logging.addMacroWarning('chris-premades', documentUtils.getIdentifier(activity.item), 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.NoTargetConditions', {notify: 'info'});
        return true;
    }
    const prefetched = workflowUtils.getWorkflowProperty(config.workflow, 'choiceRemoveCondition');
    if (prefetched?.length) {
        const refetched = prefetched.filter(uuid => fromUuidSync(uuid, {strict: false}) instanceof ActiveEffect.implementation);
        workflowUtils.setWorkflowProperty(config.workflow, 'choiceRemoveCondition', refetched);
        return;
    }
    const effects = getConditions(activity, identifier);
    if (!effects?.length && requireCondition) {
        Logging.addMacroWarning('chris-premades', documentUtils.getIdentifier(activity.item), 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.NoConditions', {notify: 'info'});
        return true;
    }
    workflowUtils.setWorkflowProperty(config.workflow, 'choiceRemoveCondition', effects?.map(effect => effect.uuid));
}
async function removeEffects(actor, selected) {
    const exhaustionId = CONFIG.ActiveEffect.documentClass.ID.EXHAUSTION;
    if (selected.some(effect => effect.id === exhaustionId)) await actorUtils.addExhaustion(actor, -1);
    const effects = selected.filter(effect => effect.id !== exhaustionId);
    const owned = effects.filter(effect => effect.parent === actor).map(effect => effect.id);
    if (owned.length) await documentUtils.deleteEmbeddedDocuments(actor, 'ActiveEffect', owned);
    await Promise.all(effects.filter(effect => effect.parent !== actor).map(effect => documentUtils.deleteDocument(effect)));
}
async function chooseConditions(workflow, actor, conditions, {affects, count, targetChooses, autoSingle}) {
    const max = Math.max(1, rollUtils.rollDiceSync(String(count), {document: workflow.activity}).total);
    let selected;
    if (autoSingle && conditions.length <= max) {
        selected = conditions;
    } else {
        const userId = affects === 'target' && targetChooses ? queryUtils.firstOwner(actor, true) : undefined;
        const selection = await dialogUtils.selectDocumentDialog(
            workflow.item.name,
            'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.' + (max > 1 ? 'SelectMany' : 'Select'),
            conditions,
            max > 1 ? {displayTooltips: true, checkbox: true, max, userId} : {displayTooltips: true, addNoneDocument: true, userId}
        );
        if (!selection) return;
        selected = max > 1 ? selection.filter(i => i.amount).map(i => i.document) : [selection];
    }
    await removeEffects(actor, selected);
}
async function reactionRemove(item, actor, reactionConditions) {
    if (!reactionConditions?.length || actorUtils.hasUsedReaction(actor)) return;
    const effects = actorUtils.getStatusSources(actor, reactionConditions);
    if (!effects?.length) return;
    const content = _loc('CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.ReactionPrompt', {conditions: effects.map(effect => effect.name).join(', ')});
    if (!await dialogUtils.confirm(item.name, content, {userId: queryUtils.firstOwner(actor, true)})) return;
    await actorUtils.setReactionUsed(actor);
    await removeEffects(actor, effects);
}
async function remove({workflow, macroClass: {identifier}}) {
    if (workflowUtils.getWorkflowProperty(workflow, 'conditionGained')) return;
    const config = automationUtils.getGenericConfigValues(workflow.activity, 'chris-premades', identifier, configKeys);
    const actor = config.affects === 'target' ? workflow.targets.documents[0]?.actor : workflow.actor;
    if (!actor) return;
    const conditions = config.affects === 'target' ? getConditions(workflow.activity, identifier, actor) : workflowUtils.getWorkflowProperty(workflow, 'choiceRemoveCondition')?.map(uuid => fromUuidSync(uuid, {strict: false})).filter(Boolean);
    const minimumRoll = Number(config.minimumRoll) || 0;
    const rollMet = config.affects === 'target' || !minimumRoll || rollUtils.getRollsTotal(workflow.utilityRolls ?? []) >= minimumRoll;
    if (conditions?.length && rollMet) await chooseConditions(workflow, actor, conditions, config);
    await reactionRemove(workflow.item, actor, config.reactionConditions);
}
async function rollFeature({document: activity, macroClass: {identifier}}) {
    await rollConditions(activity, getConditions(activity, identifier));
}
async function conditionGained({document: activity, effect, macroClass: {identifier}}) {
    const {conditions, minimumRoll} = automationUtils.getGenericConfigValues(activity, 'chris-premades', identifier, ['conditions', 'minimumRoll']);
    const statuses = new Set(effect.statuses ?? []);
    if (!conditions.some(condition => statuses.has(condition) && !activity.actor.statuses.has(condition))) return;
    const options = {};
    workflowUtils.setWorkflowProperty(options, 'conditionGained', true);
    const workflow = await workflowUtils.syntheticActivityRoll(activity, [], {options, userId: queryUtils.firstOwner(activity.actor, true)});
    return rollUtils.getRollsTotal(workflow?.utilityRolls ?? []) >= (Number(minimumRoll) || 0);
}
async function rollConditions(activity, conditions) {
    if (!conditions?.length) return;
    const options = {};
    workflowUtils.setWorkflowProperty(options, 'choiceRemoveCondition', conditions.map(effect => effect.uuid));
    await workflowUtils.syntheticActivityRoll(activity, [], {options, userId: queryUtils.firstOwner(activity.actor, true)});
}
/**
 * Prompts to remove chosen conditions from the activity's user or its target after the activity rolls. The turn end and
 * turn start variants also roll the activity on the owner's turn while it has one of the conditions. The condition gained
 * variant rolls the activity when an effect would give the owner a new listed condition, and prevents that effect when
 * the roll reaches the minimum roll.
 */
export const choiceRemoveCondition = {
    rules: 'all',
    version: '2.1.11',
    category: 'conditions',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: preChecks,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: remove,
            priority: 50
        }
    ],
    genericConfig: {
        conditions: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Conditions',
            hint: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.Conditions.Hint',
            get options() { return constants.statusOptions;}
        },
        affects: {
            default: 'self',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.Affects.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.Affects.Hint',
            options: [
                {label: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.Self', value: 'self'},
                {label: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.Target', value: 'target'}
            ]
        },
        count: {
            default: '1',
            type: 'formula',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.Count.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.Count.Hint'
        },
        targetChooses: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.TargetChooses.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.TargetChooses.Hint'
        },
        autoSingle: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.AutoSingle.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.AutoSingle.Hint'
        },
        requireCondition: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.RequireCondition.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.RequireCondition.Hint'
        },
        reactionConditions: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.ReactionConditions.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.ReactionConditions.Hint',
            get options() { return constants.statusOptions;}
        },
        minimumRoll: {
            default: '0',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.MinimumRoll.Label',
            hint: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.MinimumRoll.Hint'
        }
    }
};
const configKeys = Object.keys(choiceRemoveCondition.genericConfig);
export const turnEndChoiceRemoveCondition = {
    ...choiceRemoveCondition,
    combat: [
        {
            pass: 'actorTurnEnd',
            macro: rollFeature,
            priority: 200
        }
    ]
};
export const turnStartChoiceRemoveCondition = {
    ...choiceRemoveCondition,
    combat: [
        {
            pass: 'actorTurnStart',
            macro: rollFeature,
            priority: 200
        }
    ]
};
export const conditionGainedChoiceRemoveCondition = {
    ...choiceRemoveCondition,
    effect: [
        {
            pass: 'actorDoCreated',
            macro: conditionGained,
            priority: 50
        }
    ]
};
