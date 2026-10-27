import {animationUtils} from '../../../proxy.mjs';
import {addCast, casts, getPalette, partOption, pickFile} from '../generic/spellParts.mjs';
async function play(sourceToken, region, {cast = true, ground = true} = {}) {
    if (!region) return;
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, undefined, {file: getPalette(casts, 'orange'), wait: -500});
    const explosion = pickFile('jb2a.explosion.01.orange', 'jb2a.explosion.02.orange');
    const scorch = pickFile('jb2a.ground_cracks.orange.01', 'jb2a.impact.ground_crack.orange.01');
    const gridSize = region.parent.grid.size;
    region.shapes.forEach((shape, index) => {
        const center = {x: shape.x + shape.width / 2, y: shape.y + shape.height / 2};
        const size = shape.width / gridSize;
        /* eslint-disable indent */
        sequence
            .effect()
                .file(explosion)
                .atLocation(center)
                .size(size * 1.6, {gridUnits: true})
                .randomRotation()
                .delay(index * 120)
                .playIf(!!explosion)
            .effect()
                .file(scorch)
                .atLocation(center)
                .size(size, {gridUnits: true})
                .belowTokens()
                .randomRotation()
                .delay(index * 120 + 200)
                .fadeOut(1500)
                .playIf(ground && !!scorch);
        /* eslint-enable indent */
    });
    await sequence.play();
}
export const fireStorm = {
    name: 'CHRISPREMADES.Animations.FireStorm.Name',
    macros: {
        play
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    config: {
        cast: partOption('Cast'),
        ground: partOption('Ground', {hint: 'CHRISPREMADES.Animations.FireStorm.GroundHint'})
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
