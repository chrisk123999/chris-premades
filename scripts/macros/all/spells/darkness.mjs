import {actorUtils, automationUtils, documentUtils, genericUtils, regionUtils} from '../../../proxy.mjs';
function getOriginItem(region) {
    return regionUtils.getActivity(region)?.item;
}
function getLightRadius(region, token) {
    const radius = (region.shapes[0]?.radius ?? 0) - (token?.object?.externalRadius ?? 0);
    return Math.max(radius, 0) / region.parent.grid.size * region.parent.grid.distance;
}
function getLightPosition(region) {
    const shape = region.shapes[0];
    return {x: shape?.x ?? region.object?.center.x, y: shape?.y ?? region.object?.center.y};
}
async function darkenToken(token, region, animationType) {
    const light = genericUtils.duplicate(token._source.light);
    await documentUtils.update(token, {light: {negative: true, dim: getLightRadius(region, token), bright: 0, animation: {type: animationType}}});
    return {darknessToken: {id: token.id, light}};
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
async function getSeeingTokens(region, workflow) {
    const identifiers = automationUtils.getConfigValue(getOriginItem(region), 'seeThroughIdentifiers') ?? [];
    if (!identifiers.length || !workflow?.token) return;
    const castUuid = workflow.item?.flags.dnd5e?.cachedFor;
    if (!castUuid) return;
    const castActivity = await fromUuid(castUuid, {relative: workflow.actor});
    if (!castActivity) return;
    if (!identifiers.includes(documentUtils.getIdentifier(castActivity.item))) return;
    return [workflow.token.document.uuid];
}
async function created({document: region, workflow}) {
    const activity = regionUtils.getActivity(region);
    const originItem = activity?.item;
    if (!originItem) return;
    const updates = {name: originItem.name};
    const seeingTokens = await getSeeingTokens(region, workflow);
    if (seeingTokens) genericUtils.setProperty(updates, 'flags.cat.canSeeTokens', seeingTokens);
    if (automationUtils.getConfigValue(originItem, 'spreadAroundCorners')) {
        genericUtils.setProperty(updates, 'flags.walledtemplates.wallRestriction', 'move');
        genericUtils.setProperty(updates, 'flags.walledtemplates.wallsBlock', 'recurse');
    }
    const useRealDarkness = automationUtils.getConfigValue(originItem, 'useRealDarkness');
    if (useRealDarkness) {
        const animationType = automationUtils.getConfigValue(originItem, 'darknessAnimation');
        const token = activity.target.template.type === 'radius' ? workflow?.token?.document ?? actorUtils.getFirstToken(activity.actor) : undefined;
        const flags = token ? await darkenToken(token, region, animationType) : await createLight(region, animationType);
        if (flags) genericUtils.setProperty(updates, 'flags.chris-premades', flags);
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
    const token = region.parent.tokens.get(darknessToken?.id);
    if (token) await documentUtils.update(token, {light: darknessToken.light});
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
        darknessAnimation: {
            default: '',
            type: 'select',
            label: 'CHRISPREMADES.Config.DarknessAnimation',
            category: 'mechanics',
            get options() {
                return [{value: '', label: _loc('DND5E.None')}, ...Object.entries(CONFIG.Canvas.darknessAnimations).map(([value, config]) => ({value, label: config.label}))];
            }
        },
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
