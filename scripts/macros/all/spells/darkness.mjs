import {automationUtils, documentUtils, genericUtils} from '../../../proxy.mjs';
function getOriginItem(region) {
    return fromUuidSync(region.flags.dnd5e?.origin, {strict: false})?.item;
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
    const originItem = getOriginItem(region);
    if (!originItem) return;
    const updates = {name: originItem.name};
    const seeingTokens = await getSeeingTokens(region, workflow);
    if (seeingTokens) genericUtils.setProperty(updates, 'flags.cat.canSeeTokens', seeingTokens);
    if (automationUtils.getConfigValue(originItem, 'spreadAroundCorners')) {
        genericUtils.setProperty(updates, 'flags.walledtemplates.wallRestriction', 'move');
        genericUtils.setProperty(updates, 'flags.walledtemplates.wallsBlock', 'recurse');
    }
    await documentUtils.update(region, updates);
    if (automationUtils.getConfigValue(originItem, 'useRealDarkness')) {
        const shape = region.shapes[0];
        const [light] = await documentUtils.createEmbeddedDocuments(region.parent, 'AmbientLight', [{
            x: shape?.x ?? region.object?.center.x,
            y: shape?.y ?? region.object?.center.y,
            config: {
                negative: true,
                dim: (shape?.radius ?? 0) / region.parent.grid.size * region.parent.grid.distance,
                animation: {type: automationUtils.getConfigValue(originItem, 'darknessAnimation')}
            }
        }]);
        if (light) await documentUtils.makeDependent(region, [light]);
    }
    const {animation, options} = automationUtils.getResolvedAnimation(originItem, 'animation');
    if (animation) await animation.macros?.darkness?.(region, options);
}
async function deleted({document: region}) {
    const originItem = getOriginItem(region);
    if (!originItem) return;
    const {animation} = automationUtils.getResolvedAnimation(originItem, 'animation');
    if (animation) await animation.macros?.endDarkness?.(region);
}
export const darkness = {
    name: 'Darkness',
    version: '2.0.0',
    rules: 'all',
    region: [
        {pass: 'created', macro: created, priority: 50},
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
            category: 'animation'
        }
    }
};
