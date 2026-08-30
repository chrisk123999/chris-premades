import {automationUtils, dialogUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
async function giveTempHP({document: activity, workflow}) {
    if (workflow.item?.type !== 'spell') return;
    if (workflowUtils.getCastLevel(workflow) !== 0) return;
    const classIdentifier = automationUtils.getConfigValue(activity.item, 'classIdentifier');
    if (itemUtils.getSourceClassIdentifier(workflow.item) !== classIdentifier) return;
    if (workflowUtils.isSustainedRoll(workflow)) return;
    if (!workflow.damageList.some(d => d.totalDamage > 0)) return;
    const near = tokenUtils.findNearby(workflow.token.document, activity.range.value ?? 60, {disposition: 'ally', includeToken: true});
    if (near.length === 1) return await workflowUtils.syntheticActivityRoll(activity, near);
    const selected = await dialogUtils.selectTargetDialog(activity.item.name, 'CHRISPREMADES.Macros.Modern.ImprovedPotentSpellcasting', near, {skipDeadAndUnconscious: false});
    if (!selected || !selected.result) return;
    await workflowUtils.syntheticActivityRoll(activity, [selected.result]);
}
export const improvedPotentSpellcasting = {
    name: 'Blessed Strikes: Potent Spellcasting',
    version: '2.0.3',
    rules: '2024',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: giveTempHP,
            priority: 250
        }
    ],
    config: {
        classIdentifier: {
            default: 'cleric',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        }
    }
};
