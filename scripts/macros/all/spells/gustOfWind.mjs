import {automationUtils, effectUtils, genericUtils, itemUtils, Logging, regionUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
function getRegion(item, scene) {
    const activity = itemUtils.getActivityByIdentifier(item, 'gust-of-wind');
    if (!activity || !scene) return;
    return regionUtils.getPlacedRegions(scene, activity).at(-1);
}
async function early({workflow}) {
    if (workflow.activity.identifier !== 'gust-of-wind-push' || !workflow.token) return;
    const self = Array.from(workflow.targets).filter(token => token === workflow.token);
    if (!self.length) return;
    if (self.length === workflow.targets.size) {
        Logging.addMacroWarning('CPR', 'gust-of-wind', 'CHRISPREMADES.Macros.All.GustOfWind.SkipCaster');
        return true;
    }
    await workflowUtils.removeTargets(workflow, self);
}
async function push(item, workflow, region) {
    const tokens = Array.from(workflow.failedSaves).filter(token => token !== workflow.token && token.actor);
    if (!tokens.length) return;
    const shape = region?.shapes[0];
    if (!shape) return Logging.addMacroWarning('CPR', 'gust-of-wind', 'CHRISPREMADES.Macros.All.GustOfWind.NoRegion');
    const ray = foundry.canvas.geometry.Ray.fromAngle(0, 0, Math.toRadians(shape.rotation), 1);
    const distance = genericUtils.convertDistance(region.parent, Number(automationUtils.getConfigValue(item, 'distance')));
    if (!distance) return;
    await Promise.all(tokens.map(token => tokenUtils.slideToken(token.document, {ray, distance})));
}
async function use({document, workflow}) {
    const identifier = workflow.activity.identifier;
    if (identifier === 'gust-of-wind') {
        const region = workflow.template;
        if (!region || !workflow.token) {
            await effectUtils.endConcentration(workflow.actor, workflow.item);
            Logging.addMacroWarning('CPR', 'gust-of-wind', 'CHRISPREMADES.Macros.All.GustOfWind.NoRegion');
            return;
        }
        const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
        if (animation?.macros?.play) await animation.macros.play(workflow.token.document, region, options);
        await push(document, workflow, region);
        return;
    }
    if (identifier !== 'gust-of-wind-push') return;
    await push(document, workflow, getRegion(document, workflow.targets.first()?.document.parent));
}
export const gustOfWind = {
    name: 'Gust of Wind',
    version: '2.1.3',
    rules: 'all',
    roll: [
        {
            pass: 'itemPreItemRoll',
            macro: early,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        distance: {
            default: 15,
            type: 'number',
            label: 'CHRISPREMADES.Config.Distance',
            hint: 'CHRISPREMADES.Macros.All.GustOfWind.DistanceHint',
            category: 'homebrew'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'gustOfWind'
            },
            type: 'selectAnimation',
            inputs: ['sourceToken', 'region', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
