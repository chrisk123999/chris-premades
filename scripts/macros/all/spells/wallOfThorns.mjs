import {movementCost, wallMacro, wallSummary} from '../../generic/wallSpell.mjs';
export const wallOfThorns = wallMacro({name: 'Wall of Thorns'}, {
    animation: 'wall',
    freeDraw: true,
    shapes: {
        'wall-of-thorns': {shape: {maxLength: 60}, height: 10},
        'wall-of-thorns-ring': {shape: {ring: {maxDiameter: 20, minDiameter: 20}}, height: 20}
    },
    options: () => ({
        thickness: 5,
        walls: 'opaque',
        color: '#4f7a28',
        behaviors: [movementCost(4)],
        draw: {highlightTokens: {path: 0x7fb24a}, summary: wallSummary('CHRISPREMADES.Macros.Generic.Wall.PreviewSaves')}
    })
});
