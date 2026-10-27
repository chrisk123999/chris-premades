import {actorUtils, automationUtils, dialogUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function teleport({document: item}) {
    const token = actorUtils.getFirstToken(item.actor);
    if (!token) return;
    const range = automationUtils.getConfigValue(item, 'range');
    const userId = queryUtils.firstOwner(item.actor, true);
    const candidates = tokenUtils.findNearby(token, range, {disposition: 'ally', includeToken: true}).filter(target => target === token || tokenUtils.canSee(token, target));
    if (!candidates.includes(token)) candidates.unshift(token);
    const selection = await dialogUtils.selectTargetDialog(item.name, _loc('CHRISPREMADES.Macros.Modern.IngeniousMovement.Select', {range}), candidates, {skipDeadAndUnconscious: false, userId});
    const target = selection?.result;
    if (!target) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'ingenious-movement');
    if (activity) await workflowUtils.completeActivityUse(activity, [target], {consumeUsage: false, consumeResources: false});
    const {animation, options} = automationUtils.getResolvedAnimation(item, 'animation');
    await tokenUtils.teleportToken(target, {animation, options, range, userId});
}
export const ingeniousMovement = {
    name: 'Ingenious Movement',
    version: '2.1.4',
    rules: '2024',
    called: [
        {
            pass: 'actorFlashOfGeniusUsed',
            macro: teleport,
            priority: 50
        }
    ],
    config: {
        range: {
            default: 30,
            type: 'number',
            category: 'homebrew',
            label: 'CHRISPREMADES.Config.Range'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'mistyStep'
            },
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            category: 'animations',
            label: 'CHRISPREMADES.Config.Animation'
        }
    }
};
