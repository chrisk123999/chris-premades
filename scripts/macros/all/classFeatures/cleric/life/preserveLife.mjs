import {automationUtils, dialogUtils, genericUtils, Logging, workflowUtils} from '../../../../../proxy.mjs';
async function promptPreserveLife({document: activity}) {
    return activity;
}
async function prePreserveLife({document: activity, macroClass: {identifier, source}, workflow}){
    const limit = automationUtils.getConfigValue(activity.item, 'pctLimit') || 50;
    const invalid = workflow.targets.documents.filter(t =>
        !t.actor || t.actor.system.attributes.hp.pct >= limit
    );
    if (invalid.length) {
        Logging.addMacroWarning(source, identifier, `Preserve Life removed ${invalid.length} of ${workflow.targets.count} targets with hp above the limit. (hp pct limit) ${limit}`);
        await workflowUtils.removeTargets(workflow, invalid);
    }
    if (!workflow.targets.count) {
        genericUtils.notify('CHRISPREMADES.Macros.Legacy.HuntersMark.NoTargets', {type: 'warn'});
        return true;
    }
    workflowUtils.setWorkflowProperty(workflow, 'preserveLife', limit);
}
async function postPreserveLife({document: activity, macroClass: {identifier, source}, workflow}) {
    if (!workflow.targets.count) return;
    const maxAmount = workflow.utilityRoll.total;
    const limit = workflowUtils.getWorkflowProperty(workflow, 'preserveLife') || 50;
    const maxes = workflow.targets.documents.reduce((obj, t) => {
        const hp = t.actor.system.attributes.hp;
        obj[t.id] = Math.ceil(hp.effectiveMax * limit / 100) - hp.value;
        return obj;
    }, {});
    const choices = await dialogUtils.selectTargetDialog(activity.item.name, _loc('CHRISPREMADES.Macros.All.PreserveLife.Prompt', {maxAmount}), workflow.targets.documents, {
        skipDeadAndUnconscious: false,
        type: 'selectAmount',
        maxAmount,
        maxes
    });
    if (!choices?.result?.some(r => r.value > 0)) {
        workflow.aborted = true;
        await workflow.refundConsumption();
        return Logging.addMacroWarning(source, identifier, `Preserve Life exited early due to a declined targeting prompt. (activity) ${activity.uuid}`);
    }
    for (const {document: target, value} of choices.result)
        if (value > 0) await workflowUtils.applyDamage([target], value, 'healing');
}
export const preserveLife = {
    name: 'Preserve Life',
    version: '2.1.9',
    rules: 'all',
    called: [
        {
            pass: 'actorChannelDivinityCleric',
            macro: promptPreserveLife,
            priority: 200
        }
    ],
    roll: [
        {
            pass: 'activityTargeting',
            macro: prePreserveLife,
            priority: 55 // after generic targetCreatureTypes
        },
        {
            pass: 'activityRollFinished',
            macro: postPreserveLife,
            priority: 50
        }
    ],
    config: {
        pctLimit: {
            default: 50,
            type: 'slider',
            category: 'behavior',
            max: 100, min: 1, step: 1,
            label: 'CHRISPREMADES.Macros.All.PreserveLife.Limit'
        }
    }
};
