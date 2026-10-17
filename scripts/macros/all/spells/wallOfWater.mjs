import {documentUtils, regionUtils} from '../../../proxy.mjs';
import {difficultTerrain, getWallPanelActor, wallMacro, wallPanel, wallSummary} from '../../generic/wallSpell.mjs';
async function freeze({document: region, workflow, options}) {
    const path = region.flags.cat?.path;
    if (!path || !options?.types?.includes('cold') || workflow?.item?.type !== 'spell') return;
    const scene = region.parent;
    const pixels = scene.dimensions.distancePixels;
    const frozen = scene.regions.filter(other => other.flags['chris-premades']?.frozenOf === region.uuid);
    let sourceActor;
    for (const [a, b] of regionUtils.pathSegments(path)) {
        const hit = foundry.utils.lineSegmentIntersection(options.origin, options.target, a, b);
        if (!hit || frozen.some(section => section.testPoint({x: hit.x, y: hit.y, elevation: region.elevation.bottom}))) continue;
        const length = Math.hypot(b.x - a.x, b.y - a.y);
        const half = Math.min(2.5 * pixels, length / 2);
        const along = Math.clamp(Math.hypot(hit.x - a.x, hit.y - a.y), half, length - half);
        const unit = {x: (b.x - a.x) / length, y: (b.y - a.y) / length};
        const start = {x: a.x + unit.x * (along - half), y: a.y + unit.y * (along - half)};
        const end = {x: a.x + unit.x * (along + half), y: a.y + unit.y * (along + half)};
        const {region: section} = await regionUtils.createPathRegions(scene, {segments: [[start, end]]}, {
            thickness: 1,
            walls: 'solid',
            regionData: {
                name: `${region.name}: ${_loc('CHRISPREMADES.Macros.All.WallOfWater.Frozen')}`,
                color: '#cfeeff',
                elevation: region.elevation,
                flags: {'chris-premades': {frozenOf: region.uuid}, cat: {macros: {region: [{source: 'chris-premades', rules: 'all', identifier: 'wall-of-water'}]}}}
            }
        });
        if (!section) continue;
        await documentUtils.makeDependent(region, [section]);
        sourceActor ??= await getWallPanelActor();
        if (sourceActor) await regionUtils.addWallPanels(section, {owner: regionUtils.getActivity(region)?.actor, sourceActor, parent: section, updates: wallPanel(_loc('CHRISPREMADES.Macros.All.WallOfWater.Frozen'), {hp: 15, ac: 5, immune: ['poison', 'psychic']})});
        frozen.push(section);
    }
}
async function shatter({document: section}) {
    const water = await fromUuid(section.flags['chris-premades']?.frozenOf ?? '');
    if (!water) return;
    await documentUtils.update(water, {shapes: regionUtils.subtractShapes(water._source.shapes, section._source.shapes)});
}
export const wallOfWater = wallMacro({
    name: 'Wall of Water',
    region: [
        {pass: 'damageThrough', macro: freeze, priority: 50},
        {pass: 'panelBroken', macro: shatter, priority: 50}
    ]
}, {
    animation: 'wall',
    freeDraw: true,
    shapes: {
        'wall-of-water': {shape: {maxLength: 30}, height: 10},
        'wall-of-water-ring': {shape: {ring: {maxDiameter: 20, minDiameter: 5, step: 5}}, height: 20}
    },
    options: () => ({
        thickness: 1,
        color: '#3a7bd5',
        behaviors: [difficultTerrain()],
        flags: {cat: {rangedAttacks: 'disadvantage', damageThrough: {fire: 0.5}}},
        draw: {summary: wallSummary('CHRISPREMADES.Macros.Generic.Wall.PreviewInside')}
    })
});
