import cprConstants from '../../../constants.mjs';
import {actorUtils, automationUtils, documentUtils, effectUtils, genericUtils, regionUtils, summonUtils} from '../../../proxy.mjs';
import {createRegionLight, syncRegionLights} from '../../generic/moveRegion.mjs';
function getOriginItem(region) {
    return regionUtils.getActivity(region)?.item;
}
function getLightRadius(region, token) {
    const radius = regionUtils.getArea(region).radius - (token?.object?.externalRadius ?? 0);
    return Math.max(radius, 0) / region.parent.dimensions.distancePixels;
}
async function darkenToken(token, region, activity, animationType) {
    if (!token.actor) return;
    const changes = Object.entries({negative: true, dim: getLightRadius(region, token), bright: 0, 'animation.type': animationType}).map(([key, value]) => ({key: 'token.light.' + key, type: 'override', value, priority: 20}));
    const effectData = documentUtils.getBaseEffectData(activity, {name: activity.item.name, img: activity.item.img, origin: activity.uuid, changes});
    const [effect] = await effectUtils.createEffects(token.actor, [effectData]);
    if (effect) await documentUtils.makeDependent(region, [effect]);
}
export async function createLight(region, animationType) {
    const light = await createRegionLight(region, {negative: true, animation: {type: animationType}});
    if (light) return {darknessLight: light.id};
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
async function addTimer(activity, region) {
    const effectData = documentUtils.getBaseEffectData(activity, {
        name: activity.item.name,
        img: activity.item.img,
        origin: activity.uuid,
        duration: {value: Number(activity.duration.value) || 1, units: 'rounds', expiry: 'targetEnd'},
        macros: [{type: 'effect', macros: [{source: 'chris-premades', rules: 'all', identifier: 'darkness-timer'}]}]
    });
    genericUtils.setProperty(effectData, 'flags.chris-premades.darknessRegion', region.uuid);
    const [effect] = await effectUtils.createEffects(activity.actor, [effectData]);
    if (effect) await documentUtils.makeDependent(effect, [region]);
}
async function created({document: region, workflow}) {
    const activity = regionUtils.getActivity(region);
    const originItem = activity?.item;
    if (!originItem) return;
    if (!activity.duration.concentration && activity.duration.units === 'round') await addTimer(activity, region);
    const summonConcentration = summonUtils.getSummonData(activity.actor)?.parent;
    if (summonConcentration && !region.flags.dnd5e?.dependentOn) await documentUtils.makeDependent(summonConcentration, [region]);
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
    if (updates?.shapes) await syncRegionLights(region);
}
async function deleted({document: region}) {
    const {darknessLight, darknessToken} = region.flags['chris-premades'] ?? {};
    const originItem = getOriginItem(region);
    if (!originItem || darknessLight || darknessToken) return;
    const {animation} = automationUtils.getResolvedAnimation(originItem, 'animation');
    if (animation) await animation.macros?.endDarkness?.(region);
}
async function timerEnded({document: effect}) {
    const region = await fromUuid(effect.flags['chris-premades']?.darknessRegion ?? '');
    if (region) await documentUtils.deleteDocument(region);
}
export const darknessTimer = {
    name: 'Darkness Timer',
    version: '2.1.3',
    rules: 'all',
    effect: [
        {pass: 'deleted', macro: timerEnded, priority: 50}
    ]
};
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
