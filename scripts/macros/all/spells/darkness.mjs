import cprConstants from '../../../constants.mjs';
import {actorUtils, automationUtils, documentUtils, effectUtils, genericUtils, regionUtils} from '../../../proxy.mjs';
function getOriginItem(region) {
    return regionUtils.getActivity(region)?.item;
}
function getLightRadius(region, token) {
    const radius = regionUtils.getArea(region).radius - (token?.object?.externalRadius ?? 0);
    return Math.max(radius, 0) / region.parent.dimensions.distancePixels;
}
function getLightPosition(region) {
    const {x, y} = regionUtils.getArea(region);
    return {x: Math.round(x), y: Math.round(y)};
}
async function darkenToken(token, region, activity, animationType) {
    if (!token.actor) return;
    const changes = Object.entries({negative: true, dim: getLightRadius(region, token), bright: 0, 'animation.type': animationType}).map(([key, value]) => ({key: 'token.light.' + key, type: 'override', value, priority: 20}));
    const effectData = documentUtils.getBaseEffectData(activity, {name: activity.item.name, img: activity.item.img, origin: activity.uuid, changes});
    const [effect] = await effectUtils.createEffects(token.actor, [effectData]);
    if (effect) await documentUtils.makeDependent(region, [effect]);
}
async function createLight(region, animationType) {
    const [light] = await documentUtils.createEmbeddedDocuments(region.parent, 'AmbientLight', [{
        ...getLightPosition(region),
        config: {negative: true, dim: getLightRadius(region), animation: {type: animationType}}
    }]);
    if (!light) return;
    await documentUtils.makeDependent(region, [light]);
    return {darknessLight: light.id};
}
function getSeeingTokens(region, workflow) {
    const identifiers = automationUtils.getConfigValue(getOriginItem(region), 'seeThroughIdentifiers') ?? [];
    if (!identifiers.length || !workflow?.token) return;
    const castActivity = workflow.item?.system.linkedActivity;
    if (!castActivity) return;
    if (!identifiers.includes(documentUtils.getIdentifier(castActivity.item))) return;
    return [workflow.token.document.uuid];
}
function getDarkenedToken(region, activity, workflow) {
    if (region.attachment?.token) return region.attachment.token;
    if (activity.target.template.type !== 'radius') return;
    return workflow?.token?.document ?? actorUtils.getFirstToken(activity.actor);
}
async function created({document: region, workflow}) {
    const activity = regionUtils.getActivity(region);
    const originItem = activity?.item;
    if (!originItem) return;
    if (automationUtils.getConfigValue(originItem, 'spreadAroundCorners')) await regionUtils.spreadAroundCorners(region);
    const updates = {name: originItem.name};
    const seeingTokens = getSeeingTokens(region, workflow);
    if (seeingTokens) genericUtils.setProperty(updates, 'flags.cat.canSeeTokens', seeingTokens);
    const useRealDarkness = automationUtils.getConfigValue(originItem, 'useRealDarkness');
    if (useRealDarkness) {
        const animationType = automationUtils.getConfigValue(originItem, 'darknessAnimation');
        const token = getDarkenedToken(region, activity, workflow);
        if (token) {
            await darkenToken(token, region, activity, animationType);
            genericUtils.setProperty(updates, 'flags.chris-premades.darknessToken', true);
        } else {
            const flags = await createLight(region, animationType);
            if (flags) genericUtils.setProperty(updates, 'flags.chris-premades', flags);
        }
    }
    await documentUtils.update(region, updates);
    if (useRealDarkness) return;
    const {animation, options} = automationUtils.getResolvedAnimation(originItem, 'animation');
    if (animation) await animation.macros?.darkness?.(region, options);
}
async function updated({document: region, updates}) {
    const light = region.parent.lights.get(region.flags['chris-premades']?.darknessLight);
    if (!updates?.shapes || !light) return;
    const {x, y} = getLightPosition(region);
    if (x === light.x && y === light.y) return;
    await documentUtils.update(light, {x, y});
}
async function deleted({document: region}) {
    const {darknessLight, darknessToken} = region.flags['chris-premades'] ?? {};
    const originItem = getOriginItem(region);
    if (!originItem || darknessLight || darknessToken) return;
    const {animation} = automationUtils.getResolvedAnimation(originItem, 'animation');
    if (animation) await animation.macros?.endDarkness?.(region);
}
export const darkness = {
    name: 'Darkness',
    version: '2.0.0',
    rules: 'all',
    region: [
        {pass: 'created', macro: created, priority: 50},
        {pass: 'updated', macro: updated, priority: 50},
        {pass: 'deleted', macro: deleted, priority: 50}
    ],
    config: {
        seeThroughIdentifiers: {
            default: ['eyes-of-the-dark'],
            type: 'selectIdentifiers',
            label: 'CHRISPREMADES.Macros.All.Darkness.SeeThroughIdentifiers',
            hint: 'CHRISPREMADES.Macros.All.Darkness.SeeThroughIdentifiersHint',
            category: 'homebrew'
        },
        spreadAroundCorners: {
            default: true,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.All.Darkness.SpreadAroundCorners',
            hint: 'CHRISPREMADES.Macros.All.Darkness.SpreadAroundCornersHint',
            category: 'mechanics'
        },
        useRealDarkness: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Config.RealDarkness',
            category: 'mechanics'
        },
        darknessAnimation: cprConstants.darknessAnimationConfig,
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'darknessSphere'
            },
            type: 'selectAnimation',
            inputs: ['region', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'animations'
        }
    }
};
