import {effectUtils, regionUtils} from '../../../proxy.mjs';
import {playWallReshape, wallMacro, wallSummary} from '../../generic/wallSpell.mjs';
async function beam({document: item, workflow}) {
    if (workflow.activity.identifier !== 'wall-of-light-beam') return;
    const scene = workflow.token?.document.parent ?? canvas.scene;
    const region = regionUtils.getPlacedRegions(scene, item).find(placed => placed.flags.cat?.path);
    if (!region) return;
    const path = region.flags.cat.path;
    const points = regionUtils.trimPath(path.points, 10 * scene.dimensions.distancePixels);
    if (points.length < 2) {
        await effectUtils.endConcentration(workflow.actor, item);
        return;
    }
    const shortened = {...path, points};
    await regionUtils.reshapePathRegion(region, shortened);
    await playWallReshape(item, region, shortened);
}
export const wallOfLight = wallMacro({
    name: 'Wall of Light',
    roll: [
        {pass: 'itemRollFinished', macro: beam, priority: 50}
    ]
}, {
    animation: 'wall',
    freeDraw: true,
    shapes: {
        'wall-of-light': {shape: {maxLength: 60}}
    },
    options: () => ({
        thickness: 5,
        height: 10,
        walls: 'opaque',
        color: '#fff2b3',
        light: {bright: 120, dim: 240, color: '#fff2b3', alpha: 0.05},
        draw: {highlightTokens: {path: 0xffe680}, summary: wallSummary('CHRISPREMADES.Macros.Generic.Wall.PreviewSaves')}
    })
});
