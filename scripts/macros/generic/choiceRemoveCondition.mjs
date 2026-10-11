import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, Logging, queryUtils, workflowUtils} from '../../proxy.mjs';
function getConditions(activity, macroID) {
    const settings = automationUtils.getGenericConfigValues(activity, 'chris-premades', macroID, configKeys);
    return actorUtils.getStatusSources(activity.actor, settings.conditions);
}
async function preChecks({activity, config, macroClass: {identifier}}) {
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
async function remove({workflow}) {
    // TODO ignored exhaustion system for pugilist
    let exhaustion = workflow.actor.system.attributes.exhaustion ?? 0;
    const conditions = workflowUtils.getWorkflowProperty(workflow, 'choiceRemoveCondition');
    const selection = await dialogUtils.selectDocumentDialog(
        workflow.item.name,
        'CHRISPREMADES.Macros.Generic.ChoiceRemoveCondition',
        conditions,
        {displayTooltips: true, addNoneDocument: true}
    );
    if (!selection) return;
    exhaustion--;
    if (selection.id === CONFIG.ActiveEffect.documentClass.ID.EXHAUSTION) {
        await documentUtils.update(workflow.actor, {'system.attributes.exhaustion': exhaustion});
    } else {
        await documentUtils.deleteDocument(selection);
    }
}
async function rollFeature({document: activity, macroClass: {identifier}}) {
    const conditions = getConditions(activity, identifier);
    if (!conditions?.length) return;
    const options = {};
    workflowUtils.setWorkflowProperty(options, 'choiceRemoveCondition', conditions);
    await workflowUtils.syntheticActivityRoll(activity, [], {options, userId: queryUtils.firstOwner(activity.actor, true)});
}
/**
 * Prompts to remove one of the listed conditions from the user once the roll finishes.
 * Bound on an activity. Fires on `activityPreTargeting` and `activityRollFinished`.
 *
 * Variants:
 * - `choiceRemoveCondition`: runs when the activity is used.
 * - `turnEndChoiceRemoveCondition`: also rolls the activity on `actorTurnEnd` when a listed condition is present.
 * - `turnStartChoiceRemoveCondition`: also rolls the activity on `actorTurnStart` when a listed condition is present.
 *
 * Config:
 * - `conditions`: conditions that can be removed. The use is cancelled when the user has none of them.
 *   Choosing exhaustion lowers it by one level.
 */
export const choiceRemoveCondition = {
    rules: 'all',
    version: '2.0.4',
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
