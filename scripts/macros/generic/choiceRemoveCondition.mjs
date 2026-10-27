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
    if (automationUtils.getGenericConfigValue(activity, 'chris-premades', identifier, 'affects') === 'target') {
        const targetActor = getTargetActor(config);
        if (!targetActor || getConditions(activity, identifier, targetActor)?.length) return;
        Logging.addMacroWarning('CPR', documentUtils.getIdentifier(activity.item), 'No removable conditions on target.');
        return true;
    }
    const prefetched = workflowUtils.getWorkflowProperty(config.workflow, 'choiceRemoveCondition');
    if (prefetched?.length) {
        const refetched = prefetched.map(e => activity.actor.effects.get(e._id)).filter(e => e instanceof ActiveEffect.implementation);
        workflowUtils.setWorkflowProperty(config.workflow, 'choiceRemoveCondition', refetched);
        return;
    }
    const effects = getConditions(activity, identifier);
    if (!effects?.length) {
        Logging.addMacroWarning('CPR', documentUtils.getIdentifier(activity.item), 'No removable conditions on actor.');
        return true;
    }
    workflowUtils.setWorkflowProperty(config.workflow, 'choiceRemoveCondition', effects);
}
async function remove({workflow, macroClass: {identifier}}) {
    const {affects, count, targetChooses, autoSingle} = automationUtils.getGenericConfigValues(workflow.activity, 'chris-premades', identifier, configKeys);
    const actor = affects === 'target' ? workflow.targets.first()?.actor : workflow.actor;
    if (!actor) return;
    const conditions = affects === 'target' ? getConditions(workflow.activity, identifier, actor) : workflowUtils.getWorkflowProperty(workflow, 'choiceRemoveCondition');
    if (!conditions?.length) return;
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
    const exhaustionId = CONFIG.ActiveEffect.documentClass.ID.EXHAUSTION;
    if (selected.some(effect => effect.id === exhaustionId)) await actorUtils.addExhaustion(actor, -1);
    const effects = selected.filter(effect => effect.id !== exhaustionId);
    const owned = effects.filter(effect => effect.parent === actor).map(effect => effect.id);
    if (owned.length) await documentUtils.deleteEmbeddedDocuments(actor, 'ActiveEffect', owned);
    await Promise.all(effects.filter(effect => effect.parent !== actor).map(effect => documentUtils.deleteDocument(effect)));
}
async function rollFeature({document: activity, macroClass: {identifier}}) {
    const conditions = getConditions(activity, identifier);
    if (!conditions?.length) return;
    const options = {};
    workflowUtils.setWorkflowProperty(options, 'choiceRemoveCondition', conditions);
    await workflowUtils.syntheticActivityRoll(activity, [], {options, userId: queryUtils.firstOwner(activity.actor, true)});
}
/**
 * Prompts to remove listed conditions from the user or its target once the roll finishes.
 * Bound on an activity. Fires on `activityPreTargeting` and `activityRollFinished`.
 *
 * Variants:
 * - `choiceRemoveCondition`: runs when the activity is used.
 * - `turnEndChoiceRemoveCondition`: also rolls the activity on `actorTurnEnd` when a listed condition is present.
 * - `turnStartChoiceRemoveCondition`: also rolls the activity on `actorTurnStart` when a listed condition is present.
 *
 * Config:
 * - `conditions`: conditions that can be removed. The use is cancelled when the creature has none of them.
 *   Choosing exhaustion lowers it by one level.
 * - `affects`: remove from the activity's user or its single target.
 * - `count`: formula for how many conditions can be removed per use.
 * - `targetChooses`: with `affects` set to target, the target's owner picks the conditions.
 * - `autoSingle`: remove the conditions without a prompt when no more than `count` qualify.
 */
export const choiceRemoveCondition = {
    rules: 'all',
    version: '2.1.4',
    category: 'utility',
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
            get options() { return constants.statusOptions;}
        },
        affects: {
            default: 'self',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.Affects',
            hint: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.AffectsHint',
            options: [
                {label: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.Self', value: 'self'},
                {label: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.Target', value: 'target'}
            ]
        },
        count: {
            default: '1',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.Count',
            hint: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.CountHint'
        },
        targetChooses: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.TargetChooses',
            hint: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.TargetChoosesHint'
        },
        autoSingle: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.AutoSingle',
            hint: 'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition.AutoSingleHint'
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
