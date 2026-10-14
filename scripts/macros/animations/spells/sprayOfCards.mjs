import {animationUtils} from '../../../proxy.mjs';
import {castArea, getAreaGeometry} from '../generic/castArea.mjs';
import {addCast, addImpact, casts, colorOption, getPalette} from '../generic/spellParts.mjs';
const colorMap = {
    purple: 'Purple',
    blue: 'Blue',
    green: 'Green',
    orange: 'Orange',
    yellow: 'Yellow'
};
const cardCount = 7;
function getCardPoints(geometry, angle) {
    const spread = Math.toRadians(angle);
    const start = Math.toRadians(geometry.rotation) - (spread / 2);
    return Array.from({length: cardCount}, (_, index) => {
        const direction = start + (spread * (index + 0.5) / cardCount);
        return {x: geometry.origin.x + (Math.cos(direction) * geometry.size), y: geometry.origin.y + (Math.sin(direction) * geometry.size)};
    });
}
async function play(sourceToken, region, {color = 'purple', targets = [], radius} = {}) {
    const geometry = getAreaGeometry(sourceToken, region, {radius});
    if (!sourceToken || !geometry.end) return;
    if (animationUtils.jb2aCheck() !== 'patreon') return await castArea.macros.play(sourceToken, region, {color: 'blue', targets, radius});
    const sequence = new Sequence();
    addCast(sequence, sourceToken, geometry.end, {file: getPalette(casts, color === 'purple' ? 'dark_purple' : color), wait: -750});
    getCardPoints(geometry, region.shapes[0].angle ?? 53.13).forEach(point => {
        /* eslint-disable indent */
        sequence
            .effect()
                .file('jb2a.ranged.card.01.projectile.01.' + color)
                .atLocation(geometry.origin)
                .stretchTo(point)
                .delay(Math.floor(Math.random() * 300))
                .zIndex(2);
        /* eslint-enable indent */
    });
    sequence.wait(600);
    targets.filter(target => target.saved === false).forEach(target => addImpact(sequence, target.token, color));
    await sequence.play();
}
export const sprayOfCards = {
    name: 'CHRISPREMADES.Animations.SprayOfCards',
    macros: {
        play
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            color: colorOption(colorMap, [], {auto: false, hint: 'CHRISPREMADES.Animations.SprayOfCardsColorHint'})
        };
    }
};
