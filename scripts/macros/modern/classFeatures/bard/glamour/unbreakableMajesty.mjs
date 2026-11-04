import {effectUtils, itemUtils, Logging, workflowUtils} from '../../../../../proxy.mjs';
async function makeMiss({document: effect, macroClass: {identifier, source}, sourceToken, workflow}) {
    if (!workflow.hitTargets.has(sourceToken.object)) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    const origin = await effectUtils.getOriginActivity(effect);
    if (!origin) return Logging.addMacroWarning(source, identifier, `Unbreakable Majesty exited early without locating the origin item. (effect) ${effect.uuid}`);
    const save = itemUtils.getActivityByIdentifier(origin.item, 'majesty-save');
    if (!save) return Logging.addMacroWarning(source, identifier, `Unbreakable Majesty exited early without locating its save activity (item) ${origin.item.uuid}`);
    if (!save.uses.value) return;
    const result = await workflowUtils.syntheticActivityRoll(save, [workflow.token.document]);
    if (!result.failedSaves.size) return;
    workflow.hitTargets = workflow.hitTargets.filter(t => t.id !== sourceToken.id);
    const data = workflow.hitDisplayData[sourceToken.uuid];
    data.isHit = false;
    data.hitClass = 'failure';
    data.hitSymbol = 'fa-xmark';
    data.acIcons.push({icon: 'fas fa-bolt', tooltip: effect.name, cssClass: 'midi-qol-ac-icon-fa'});
    await workflow.displayHits(workflow.whisperAttackCard);
}
export const unbreakableMajesty = {
    name: 'Unbreakable Majesty',
    version: '2.1.7',
    rules: '2024',
    roll: [
        {
            pass: 'targetAttackRollComplete',
            macro: makeMiss,
            priority: 300
        }
    ]
};
