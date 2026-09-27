import {actorUtils, automationUtils} from '../../../../proxy.mjs';
async function flurry({workflow}) {
    const config = automationUtils.getConfigValues(workflow.item, Object.keys(flurryOfBlows.config));
    if (!config.prompt) return;
    const strike = actorUtils.getItemByIdentifier(workflow.actor, config.identifier);
    if (!strike) return;
    const bonuses = await automationUtils.calledEvent('flurryOfBlows', workflow.actor, {multiResult: true, canOverlap: true, data: {workflow, baseCount: config.attacks}}) ?? [];
    console.log('FLURRY OF BLOWS', {config, strike, bonuses});
    // TODO prompts, collect targets, roll strike item
}
export const flurryOfBlows = {
    name: 'Flurry of Blows',
    version: '2.0.4',
    rules: 'all',
    notes: 'Return a number from the "actorFlurryOfBlows" called event (async) to modify the number of attacks.\n\tData available: workflow, baseCount.',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: flurry,
            priority: 50
        }
    ],
    config: {
        attacks: {
            default: 2,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Attacks'
        },
        prompt: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.PromptTargets'
        },
        identifier: {
            default: 'unarmed-strike',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Identifier',
            hint: 'CHRISPREMADES.Macros.All.FlurryOfBlows'
        }
    }
};
