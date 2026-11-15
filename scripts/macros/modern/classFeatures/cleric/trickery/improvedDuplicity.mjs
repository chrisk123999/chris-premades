import {dataUtils, dialogUtils, documentUtils, Logging, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function illusionEnd({document: activity, summon, macroClass: {identifier, source}}) {
    const id = documentUtils.getIdentifier(summon.sourceItem);
    if (!['invoke-duplicity', 'channel-divinity-invoke-duplicity'].includes(id)) return;
    if (!summon.token)
        return Logging.addMacroWarning(source, identifier, `Improved Duplicity: Healing Illusion exited early without a placed illusion token. (activity) ${activity.uuid}`);
    const targets = tokenUtils.findNearby(summon.token, 5, {disposition: 'ally'});
    if (summon.ownerToken && !targets.some(t => t.id === summon.ownerToken.id)) targets.push(summon.ownerToken);
    if (!targets.length)
        return Logging.addMacroWarning(source, identifier, `Improved Duplicity: Healing Illusion exited early with no allies in range.`);
    const choice = await dialogUtils.selectTargetDialog(activity.item.name, 'CHRISPREMADES.Macros.Modern.ImprovedDuplicity', targets, {skipDeadAndUnconscious: false});
    if (choice?.result) await workflowUtils.syntheticActivityRoll(activity, [choice.result]);
}
async function addPackTactics({document: activity, summon, updates, macroClass: {identifier, source}}) {
    const id = documentUtils.getIdentifier(summon.sourceItem);
    if (!['invoke-duplicity', 'channel-divinity-invoke-duplicity'].includes(id)) return;
    const effect = documentUtils.getEffectByIdentifier(activity.item, 'improvedDuplicity')?.toObject();
    if (!effect) return Logging.addMacroWarning(source, identifier, `Improved Duplicity: Shared Distraction exited early without locating its active effect. (activity) ${activity.uuid} (effect identifier) improvedDuplicity`);
    dataUtils.setOrigin(effect, activity);
    updates.effects.push(effect);
}
export const improvedDuplicity = {
    name: 'Improved Duplicity',
    version: '2.1.9',
    rules: '2024',
    summon: [
        {
            pass: 'actorPreDelete',
            macro: illusionEnd,
            priority: 200
        },
        {
            pass: 'actorPreCreate',
            macro: addPackTactics,
            priority: 200
        }
    ]
};
