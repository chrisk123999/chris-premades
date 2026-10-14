import {animationUtils} from '../../../proxy.mjs';
import {getAreaGeometry} from '../generic/castArea.mjs';
import {partOption} from '../generic/spellParts.mjs';
async function play(sourceToken, region, {cast = true, persist = true} = {}) {
    if (!region) return;
    const geometry = getAreaGeometry(sourceToken, region);
    const isPatreon = animationUtils.jb2aCheck() === 'patreon';
    const sequence = new Sequence();
    /* eslint-disable indent */
    if (cast && sourceToken) {
        sequence
            .effect()
                .file('jb2a.magic_signs.circle.02.enchantment.loop.pink')
                .attachTo(sourceToken)
                .scaleToObject(1.25)
                .rotateIn(180, 600, {ease: 'easeOutCubic'})
                .scaleIn(0, 600, {ease: 'easeOutCubic'})
                .belowTokens()
                .duration(2500)
                .fadeOut(1000)
            .wait(750);
    }
    sequence
        .effect()
            .file('jb2a.magic_signs.circle.02.enchantment.complete.pink')
            .atLocation(geometry.center)
            .size(geometry.size)
            .fadeIn(600)
            .fadeOut(1000)
            .rotateIn(180, 600, {ease: 'easeOutCubic'})
            .scaleIn(0, 600, {ease: 'easeOutCubic'})
            .belowTokens()
            .zIndex(1)
        .effect()
            .file('jb2a.particles.outward.white.01.02')
            .atLocation(geometry.center)
            .size(geometry.size)
            .delay(500)
            .fadeOut(1000)
            .duration(2000)
            .zIndex(2)
            .playIf(isPatreon);
    if (persist) {
        sequence
            .effect()
                .name('zoneOfTruth ' + region.uuid)
                .file('jb2a.magic_signs.circle.02.enchantment.loop.dark_pink')
                .atLocation(geometry.center)
                .size(geometry.size)
                .delay(2500)
                .opacity(0.4)
                .fadeIn(2000)
                .fadeOut(1000)
                .belowTokens()
                .zIndex(0)
                .persist()
                .tieToDocuments(region);
    }
    /* eslint-enable indent */
    await sequence.play();
}
export const zoneOfTruth = {
    name: 'CHRISPREMADES.Animations.ZoneOfTruth.Name',
    macros: {
        play
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    config: {
        cast: partOption('Cast'),
        persist: partOption('Persist')
    }
};
