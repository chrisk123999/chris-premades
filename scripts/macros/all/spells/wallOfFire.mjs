import {wallMacro, wallSummary} from '../../generic/wallSpell.mjs';
const summary = wallSummary('CHRISPREMADES.Macros.Generic.Wall.PreviewSaves', 'CHRISPREMADES.Macros.All.WallOfFire.PreviewHeat');
export const wallOfFire = wallMacro({name: 'Wall of Fire'}, {
    animation: 'wallOfFire',
    freeDraw: true,
    shapes: {
        'wall-of-fire-wall': {shape: {maxLength: 60}},
        'wall-of-fire-ring': {shape: {ring: {maxDiameter: 20, minDiameter: 5, step: 5}}}
    },
    options: () => ({
        thickness: 1,
        height: 20,
        walls: 'opaque',
        color: '#ff6400',
        side: {identifier: 'wall-of-fire-damage', depth: 10, color: '#ffaa00', name: _loc('CHRISPREMADES.Macros.All.WallOfFire.Heat')},
        draw: {highlightTokens: {path: 0xff3300, side: 0xffb000}, summary}
    })
});
