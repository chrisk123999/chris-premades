import {wallMacro, wallSummary} from '../../generic/wallSpell.mjs';
export const wallOfForce = wallMacro({name: 'Wall of Force'}, {
    animation: 'wall',
    shapes: {
        'wall-of-force': {shape: {panels: {count: 10, size: 10, flat: true}}},
        'wall-of-force-dome': {shape: {ring: {maxDiameter: 20, minDiameter: 5, step: 5}}}
    },
    options: () => ({
        thickness: 1,
        walls: 'clear',
        push: true,
        color: '#8fd3ff',
        draw: {summary: wallSummary('CHRISPREMADES.Macros.Generic.Wall.PreviewPushed')}
    })
});
