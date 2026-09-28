import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, workflowUtils} from '../../proxy.mjs';
function getConditions(activity) {
    const settings = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'choiceRemoveCondition', configKeys);
    return actorUtils.getStatusSources(activity.actor, settings.conditions);
}
async function preChecks({activity, config}) {
    const prefetched = workflowUtils.getWorkflowProperty(config.workflow, 'choiceRemoveCondition');
    if (prefetched?.length) {
        const refetched = prefetched.map(e => activity.actor.effects.get(e._id)).filter(e => e instanceof ActiveEffect.implementation);
        workflowUtils.setWorkflowProperty(config.workflow, 'choiceRemoveCondition', refetched);
        return;
    }
    const effects = getConditions(activity);
    if (!effects?.length) return true;
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
    if (selection.id === CONFIG.statusEffects.find(s => s.id === 'exhaustion')?._id ?? 'dnd5eexhaustion0') {
        await documentUtils.update(workflow.actor, {'system.attributes.exhaustion': exhaustion});
    } else {
        await documentUtils.deleteDocument(selection);
    }
}
export const choiceRemoveCondition = {
    rules: 'all',
    version: '2.0.4',
    category: 'utility',
    generic: true,
    documents: ['activity'],
    getConditions,
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
            get options() { return constants.statusOptions();}
        }
    }
};
const configKeys = Object.keys(choiceRemoveCondition.genericConfig);
