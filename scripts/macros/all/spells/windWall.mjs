import {wallMacro, wallSummary} from '../../generic/wallSpell.mjs';
const summary = wallSummary('CHRISPREMADES.Macros.Generic.Wall.PreviewSaves');
export const windWall = wallMacro({name: 'Wind Wall'}, {
    animation: 'wall',
    shapes: {
        'wind-wall': {shape: {maxLength: 50}}
    },
    options: () => ({
        thickness: 1,
        height: 15,
        color: '#c8e6ff',
        flags: {cat: {rangedAttacks: 'miss'}},
        draw: {highlightTokens: {path: 0x99ccff}, summary}
    })
});
