import {actorUtils, automationUtils, constants, dialogUtils, genericUtils, Logging, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function editRage({data, document: activity, macroClass: {source}}) {
    // demiurgic colossus replaces this value
    const size = automationUtils.getConfigValue(activity.item, 'size');
    genericUtils.setProperty(data.effectData, `flags.${source}.rage.impelSize`, size);
}
function exit(workflow, source, id, msg, notify) {
    Logging.addMacroWarning(source, id, msg, {notify});
    return workflow.aborted = true;
}
async function hurlTargeting({document: activity, macroClass: {identifier, source}, workflow}) {
    const rage = actorUtils.getEffectByIdentifier(activity.actor, 'rage');
    const config = rage?.flags[source]?.rage;
    if (!config.giantReach || !config?.impelSize)
        return exit(workflow, source, identifier, `Mighty Impel exited early due to missing configs on the rage effect. (effect) ${rage?.uuid}`);
    const reach = 5 + config.giantReach;
    const sizeLimit = CONFIG.DND5E.actorSizes[config.impelSize]?.numerical ?? 2;
    const isSmallEnough = t => t.actor && actorUtils.getSize(t.actor) <= sizeLimit;
    if (workflow.targets.every(t => isSmallEnough(t) && tokenUtils.getDistance(t.document, workflow.token.document) <= reach)) return;
    const targets = tokenUtils.findNearby(workflow.token.document, reach, {disposition: 'all'}).filter(isSmallEnough);
    if (!targets.length) return exit(workflow, source, identifier, 'CHRISPREMADES.Macros.Modern.HuntersMark.NoTargets', true);
    const choice = await dialogUtils.selectTargetDialog(activity.item.name, 'CHRISPREMADES.Generic.SelectTarget', targets, {skipDeadAndUnconscious: false});
    if (!choice?.result) return exit(source, identifier, `Mighty Impel exited early due to a declined target prompt. (activity) ${activity.uuid}`);
    await workflowUtils.updateTargets(workflow, [choice.result]);
}
async function hurl({document: activity, workflow}) {
    if (!workflow.failedSaves.size) return;
    const range = automationUtils.getConfigValue(activity.item, 'range');
    for (const target of workflow.failedSaves)
        await tokenUtils.displaceToken(target.document, {range, sourceToken: workflow.token.document});
}
export const mightyImpel = {
    name: 'Mighty Impel',
    version: '2.1.5',
    rules: '2014',
    called: [
        {
            pass: 'actorPreCreateRageEffect',
            macro: editRage,
            priority: 255
        }
    ],
    roll: [
        {
            pass: 'activityTargeting',
            macro: hurlTargeting,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: hurl,
            priority: 50
        }
    ],
    config: {
        range: {
            default: 30,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range'
        },
        size: {
            default: 'med',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Legacy.MightyImpel.Size',
            get options() { return constants.sizeOptions; }
        }
    }
};
