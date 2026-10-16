import {wallMacro, wallPanel, wallSummary} from '../../generic/wallSpell.mjs';
export const wallOfSnow = wallMacro({name: 'Wall of Snow'}, {
    animation: 'wall',
    shapes: {
        'wall-of-snow': {shape: {maxLength: 50}, height: 15},
        'wall-of-snow-dome': {shape: {ring: {maxDiameter: 20, minDiameter: 20, segments: 8}}, height: 10}
    },
    options: item => ({
        thickness: 1,
        walls: 'solid',
        sectionLength: 10,
        push: true,
        color: '#e8f4ff',
        panels: wallPanel(item.name, {hp: 10, ac: 10, immune: ['cold', 'poison', 'psychic'], vulnerable: ['fire', 'radiant']}),
        draw: {summary: wallSummary('CHRISPREMADES.Macros.Generic.Wall.PreviewPushed')}
    })
});
