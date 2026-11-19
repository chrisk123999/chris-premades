import {automationUtils, dialogUtils, documentUtils, Logging, summonUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function postUseIllusion({document: activity, macroClass: {identifier, source}, workflow}) {
    if (workflow.activity.uuid === activity.uuid) return;
    if (!workflow.token) return Logging.addMacroWarning(source, identifier, `Tricker's Transposition exited early without a placed token. (activity) ${activity.uuid}`);
    const config = automationUtils.getConfigValues(activity.item, Object.keys(trickstersTransposition.config));
    if (!config.prompt) return;
    const act = documentUtils.getIdentifier(workflow.activity);
    const item = documentUtils.getIdentifier(workflow.item);
    if (config.item.length && !config.item.includes(item)) return;
    if (config.activities.length && !config.activities.includes(act)) return;
    if (!await dialogUtils.confirmUseItem(activity.item)) return;
    await workflowUtils.syntheticActivityRoll(activity, [workflow.tokenDocument]);
}
async function swap({macroClass: {identifier, source}, workflow}) {
    const summons = summonUtils.getSummonsByIdentifier('cpr-invoke-duplicity', {actor: workflow.actor}).filter(s => s.token);
    if (!summons.length) {
        Logging.addMacroWarning(source, identifier, 'CAT.Macros.Summon.PlaceSummonFirst', {notify: true, format: {feature: workflow.item.name, activity: workflow.activity.name}});
        return true;
    }
    let summon = summons[0];
    if (summons.length > 1) summon = (await dialogUtils.selectTargetDialog(
        workflow.item.name,
        'CHRISPREMADES.Macros.Modern.TrickstersTransposition',
        summons.map(s => s.token),
        {skipDeadAndUnconscious: false}
    ))?.result;
    if (!summon) return;
    await tokenUtils.swapTokens(workflow.token.document, summon.token ?? summon);
}
export const trickstersTransposition = {
    name: 'Trickster\'s Transposition',
    version: '2.1.9',
    rules: '2024',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: postUseIllusion,
            priority: 250
        },
        {
            pass: 'activityPreambleComplete',
            macro: swap,
            priority: 50
        }
    ],
    config: {
        prompt: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.PromptToUse'
        },
        item: {
            default: ['invoke-duplicity'],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Identifier'
        },
        activities: {
            default: ['duplicity-summon', 'duplicity-move'],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.ActivityIdentifier'
        }
    }
};
