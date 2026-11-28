import {effectUtils, itemUtils, Logging, workflowUtils} from '../../../../../proxy.mjs';
async function makeMiss({document: effect, hitData, macroClass: {identifier, source}, sourceToken, workflow}) {
    if (!hitData.isHit || hitData.hitOverridden) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    const origin = await effectUtils.getOriginActivity(effect);
    if (!origin) return Logging.addMacroWarning(source, identifier, `Unbreakable Majesty exited early without locating the origin item. (effect) ${effect.uuid}`);
    const save = itemUtils.getActivityByIdentifier(origin.item, 'majesty-save');
    if (!save) return Logging.addMacroWarning(source, identifier, `Unbreakable Majesty exited early without locating its save activity (item) ${origin.item.uuid}`);
    if (!save.uses.value) return;
    const result = await workflowUtils.syntheticActivityRoll(save, [workflow.token.document]);
    if (result.failedSaves.count) workflowUtils.changeHit(workflow, hitData, false, {document: origin.item});
}
export const unbreakableMajesty = {
    name: 'Unbreakable Majesty',
    version: '2.1.7',
    rules: '2024',
    roll: [
        {
            pass: 'targetChangeHit',
            macro: makeMiss,
            priority: 300
        }
    ]
};
