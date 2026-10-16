import {documentUtils, itemUtils, regionUtils} from '../../../proxy.mjs';
import {wallMacro, wallPanel, wallSummary} from '../../generic/wallSpell.mjs';
async function broken({document: region, options}) {
    const item = regionUtils.getActivity(region)?.item;
    const frigid = item && itemUtils.getActivityByIdentifier(item, 'wall-of-ice-frigid');
    if (!frigid) return;
    const scene = region.parent;
    const flat = options?.flat;
    let shapes;
    if (options?.segment) shapes = regionUtils.pathBand({segments: [options.segment]}, 2 * scene.dimensions.distancePixels);
    else if (flat) shapes = [{type: 'rectangle', x: flat.x, y: flat.y, width: flat.size, height: flat.size}];
    else return;
    const [air] = await documentUtils.createEmbeddedDocuments(scene, 'Region', [{
        name: `${item.name}: ${_loc('CHRISPREMADES.Macros.Generic.Wall.FrigidAir')}`,
        color: '#e0f7ff',
        shapes,
        elevation: flat ? {bottom: flat.elevation - 1, top: flat.elevation + 1} : undefined,
        flags: {dnd5e: {...region.flags.dnd5e, activity: frigid.uuid}}
    }], {cat: {pathRegion: true}}) ?? [];
    if (air) await documentUtils.makeDependent(region, [air]);
}
export const wallOfIce = wallMacro({
    name: 'Wall of Ice',
    region: [
        {pass: 'panelBroken', macro: broken, priority: 50}
    ]
}, {
    animation: 'wall',
    shapes: {
        'wall-of-ice': {shape: {panels: {count: 10, size: 10, flat: true}}},
        'wall-of-ice-dome': {shape: {ring: {maxDiameter: 20, minDiameter: 5, step: 5, segments: 8}}}
    },
    options: item => ({
        thickness: 1,
        walls: 'clear',
        sectionLength: 10,
        push: true,
        color: '#bfe6ff',
        panels: wallPanel(item.name, {hp: 30, ac: 12, immune: ['cold', 'poison', 'psychic'], vulnerable: ['fire']}),
        draw: {summary: wallSummary('CHRISPREMADES.Macros.Generic.Wall.PreviewSaves')}
    })
});
