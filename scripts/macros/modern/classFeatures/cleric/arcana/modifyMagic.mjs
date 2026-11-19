import {activityUtils, dialogUtils, Logging, rollUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function fortify({document: activity, macroClass: {identifier, source}, workflow}) {
    if (workflowUtils.getWorkflowProperty(workflow, 'modifyMagic')) return;
    if (workflow.item.type !== 'spell' || workflowUtils.isSustainedRoll(workflow)) return;
    const allies = workflow.targets.documents.filter(t => !tokenUtils.isEnemy(t, workflow.tokenDocument));
    if (!allies.length) return;
    if (!activityUtils.checkCosts(activity))
        return Logging.addMacroWarning(source, identifier, `Modify Magic exited early without channel divinity uses. (activity) ${activity.uuid}`);
    const target = await chooseTarget(allies, activity);
    if (target) await workflowUtils.syntheticActivityRoll(activity, [target]);
}
async function tenacious({document: activity, macroClass: {identifier, source}, workflow}) {
    if (!workflow.activity.hasSave || workflow.item.type !== 'spell' || workflowUtils.isSustainedRoll(workflow)) return;
    const enemies = workflow.saves.documents.filter(t => tokenUtils.isEnemy(t, workflow.tokenDocument) && tokenUtils.canSee(workflow.tokenDocument, t));
    if (!enemies.length) return;
    if (!activityUtils.checkCosts(activity))
        return Logging.addMacroWarning(source, identifier, `Modify Magic exited early without channel divinity uses. (activity) ${activity.uuid}`);
    const target = await chooseTarget(enemies, activity);
    if (!target) return;
    const penalty = (await workflowUtils.syntheticActivityRoll(activity, [target]))?.utilityRoll.total ?? 0;
    const newRoll = await rollUtils.addToRoll(workflow.targetSaveDetails[target.uuid].saveRoll, -penalty);
    await workflow.buildSaveDisplayEntry(target, newRoll, newRoll.isSuccess, newRoll.options.target);
    workflow.updateSaveFailSets(target, newRoll.isSuccess);
    await workflow.displaySaves(MidiQOL.configSettings().autoCheckSaves === 'whisper');
    workflowUtils.setWorkflowProperty(workflow, 'modifyMagic', true);
}
async function chooseTarget(targets, activity) {
    if (targets.length == 1)
        return (await dialogUtils.confirm(activity.item.name, _loc('CAT.Dialog.UseOn', {
            target: dialogUtils.getTokenName(targets[0]),
            document: activity.name
        }))) ? targets[0] : undefined;
    return (await dialogUtils.selectTargetDialog(
        activity.item.name,
        _loc('CAT.Dialog.Use', {document: activity.name}),
        targets,
        {skipDeadAndUnconscious: false}
    ))?.result;
}
export const modifyMagicFortify = {
    name: 'Modify Magic',
    version: '2.1.9',
    rules: '2024',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: fortify,
            priority: 200
        }
    ]
};
export const modifyMagicTenacious = {
    version: modifyMagicFortify.version,
    rules:  modifyMagicFortify.rules,
    roll: [
        {
            pass: 'actorSavesComplete',
            macro: tenacious,
            priority: 200
        }
    ]
};

