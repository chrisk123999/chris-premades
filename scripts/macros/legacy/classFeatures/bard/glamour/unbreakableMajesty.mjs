import {dialogUtils, effectUtils, itemUtils, Logging, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function retarget({document: effect, macroClass: {identifier, source}, sourceToken, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    const origin = await effectUtils.getOriginActivity(effect);
    if (!origin) return Logging.addMacroWarning(source, identifier, `Unbreakable Majesty exited early without locating the origin item. (effect) ${effect.uuid}`);
    const save = itemUtils.getActivityByIdentifier(origin.item, 'majesty-save');
    if (!save) return Logging.addMacroWarning(source, identifier, `Unbreakable Majesty exited early without locating its save activity (item) ${origin.item.uuid}`);
    if (!save.uses.value) return;
    const result = await workflowUtils.syntheticActivityRoll(save, [workflow.token.document]);
    if (!result.failedSaves.count) return;
    await workflowUtils.removeTargets(workflow, [sourceToken]);
    const near = tokenUtils.findNearby(workflow.token.document, workflowUtils.getRange(workflow), {disposition: 'enemy'}).filter(t => t.id !== sourceToken.id);
    if (!near.length) return;
    const newTarget = await dialogUtils.selectTargetDialog(effect.name, 'CHRISPREMADES.Macros.Legacy.UnbreakableMajesty', near, {skipDeadAndUnconscious: false});
    if (!newTarget?.result) return;
    workflow.targets.add(newTarget.result);
    await workflowUtils.updateTargets(workflow, workflow.targets.documents);
}
export const unbreakableMajesty = {
    name: 'Unbreakable Majesty',
    version: '2.1.7',
    rules: '2014',
    roll: [
        {
            pass: 'targetTargeting',
            macro: retarget,
            priority: 300
        }
    ]
};
