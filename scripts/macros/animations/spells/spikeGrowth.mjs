import {regionUtils} from '../../../proxy.mjs';
import {addCast, casts, getPalette, partOption} from '../generic/spellParts.mjs';
async function play(sourceToken, region, {cast = true, opacity = 0.8} = {}) {
    if (!region) return;
    const area = regionUtils.getArea(region);
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, area, {file: getPalette(casts, 'green'), wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .name('spikeGrowth ' + region.uuid)
            .file('jb2a.entangle.brown')
            .attachTo(region)
            .mask(region)
            .size(area.radius * 2)
            .belowTokens()
            .opacity(opacity)
            .fadeIn(1500)
            .scaleIn(0, 1500, {ease: 'easeOutCubic'})
            .fadeOut(1500)
            .persist()
            .tieToDocuments(region);
    /* eslint-enable indent */
    await sequence.play();
}
export const spikeGrowth = {
    name: 'CHRISPREMADES.Animations.SpikeGrowth.Name',
    sound: 'psfx.1st-level-spells.entangle.vines.v1.001.intro',
    macros: {
        play
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    config: {
        cast: partOption('Cast'),
        opacity: {
            label: 'CHRISPREMADES.Config.Opacity',
            hint: 'CHRISPREMADES.Animations.SpikeGrowth.Opacity.Hint',
            type: 'number',
            default: 0.8
        }
    }
};
