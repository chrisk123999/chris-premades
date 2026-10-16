import {movementCost, wallMacro, wallSummary} from '../../generic/wallSpell.mjs';
export const wallOfSand = wallMacro({name: 'Wall of Sand'}, {
    animation: 'wall',
    freeDraw: true,
    shapes: {
        'wall-of-sand': {shape: {maxLength: 30}}
    },
    options: () => ({
        thickness: 10,
        height: 10,
        walls: 'opaque',
        color: '#d2b48c',
        behaviors: [movementCost(3)],
        draw: {summary: wallSummary('CHRISPREMADES.Macros.Generic.Wall.PreviewInside')}
    })
});
