import {actorUtils, automationUtils, dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function early({document, config, dialog}) {
    if (document.item.system.uses.value) return;
    const spendActivity = itemUtils.getActivityByIdentifier(document.item, 'warping-implosion-cost');
    if (!spendActivity) return true;
    const sorceryPoints = actorUtils.getItemByIdentifier(document.actor, 'font-of-magic');
    const cost = Number(spendActivity.consumption.targets[0]?.value ?? 0);
    if (!sorceryPoints || sorceryPoints.system.uses.value < cost) return true;
    const selection = await dialogUtils.confirmUseExtraCost(document.item, cost, sorceryPoints.name);
    if (!selection) return true;
    dialog.configure = false;
    genericUtils.setProperty(config, 'consume.resources', false);
    await workflowUtils.completeActivityUse(spendActivity, []);
}
async function use({document, workflow}) {
    if (!workflow.token) return;
    const sourceToken = workflow.token.document;
    const pulled = Array.from(workflow.failedSaves, target => target.document ?? target)
        .map(targetToken => ({targetToken, distance: tokenUtils.getDistance(sourceToken, targetToken)}))
        .sort((a, b) => a.distance - b.distance);
    for (const {targetToken, distance} of pulled) {
        const slide = Math.min(0, 5 - distance);
        if (slide) await tokenUtils.slideToken(targetToken, {sourceToken, distance: slide});
    }
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    await tokenUtils.teleportToken(sourceToken, {animation, options, range: workflow.activity.range.value});
}
export const warpingImplosion = {
    name: 'Warping Implosion',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'activityPreTargeting', macro: early, priority: 50},
        {pass: 'activityRollFinished', macro: use, priority: 50}
    ],
    config: {
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'mistyStep'
            },
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
