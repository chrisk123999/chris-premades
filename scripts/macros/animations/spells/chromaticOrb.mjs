import {animationUtils, tokenUtils} from '../../../proxy.mjs';
import {getPalette, partOption} from '../generic/spellParts.mjs';
const orbit = 'jb2a.aura_themed.01.orbit.complete.metal.01.grey';
const bases = {
    patreon: {
        burst: 'jb2a.moonbeam.01.complete.rainbow',
        trail: 'jb2a.moonbeam.01.loop.rainbow'
    },
    free: {
        burst: 'jb2a.moonbeam.01.complete.blue',
        trail: 'jb2a.moonbeam.01.loop.blue'
    }
};
const elements = {
    patreon: {
        force: {orb: 'jb2a.markers.light_orb.loop.dark_blue', cast: 'jb2a.impact.002.dark_purple', hit: 'jb2a.impact.005.purple'},
        acid: {orb: 'jb2a.markers.light_orb.loop.yellow', cast: 'jb2a.impact.002.green', hit: 'jb2a.liquid.splash.bright_green'},
        cold: {orb: 'jb2a.markers.light_orb.loop.blue', cast: 'jb2a.impact.002.blue', hit: 'jb2a.impact_themed.ice_shard.blue'},
        fire: {orb: 'jb2a.markers.light_orb.loop.yellow', cast: 'jb2a.impact.002.orange', hit: 'jb2a.impact.fire.01.orange'},
        lightning: {orb: 'jb2a.markers.light_orb.loop.white', cast: 'jb2a.impact.002.yellow', hit: 'jb2a.impact.011.yellow'},
        poison: {orb: 'jb2a.markers.light_orb.loop.green', cast: 'jb2a.impact.002.green', hit: 'jb2a.impact_themed.poison.greenyellow'},
        psychic: {orb: 'jb2a.markers.light_orb.loop.white', cast: 'jb2a.impact.002.pinkpurple', hit: 'jb2a.impact_themed.skull.pinkpurple'},
        thunder: {orb: 'jb2a.markers.light_orb.loop.white', cast: 'jb2a.impact.002.blue', hit: 'jb2a.soundwave.02.blue'}
    },
    free: {
        force: {orb: 'jb2a.markers.light_orb.loop.blue', cast: 'jb2a.impact.002.blue', hit: 'jb2a.impact.004.blue'},
        cold: {orb: 'jb2a.markers.light_orb.loop.blue', cast: 'jb2a.impact.002.blue', hit: 'jb2a.impact_themed.ice_shard.blue'},
        fire: {orb: 'jb2a.markers.light_orb.loop.blue', cast: 'jb2a.impact.002.blue', hit: 'jb2a.impact.fire.01.orange'},
        lightning: {orb: 'jb2a.markers.light_orb.loop.blue', cast: 'jb2a.impact.002.blue', hit: 'jb2a.impact.011.blue'},
        thunder: {orb: 'jb2a.markers.light_orb.loop.blue', cast: 'jb2a.impact.002.blue', hit: 'jb2a.soundwave.02.blue'}
    }
};
async function play(sourceToken, targetToken, {damageType, hit, cast = true} = {}) {
    const base = bases[animationUtils.jb2aCheck()];
    const files = getPalette(elements, damageType);
    if (!base || !files) return;
    const landed = hit !== false;
    const travel = 800 + 100 * tokenUtils.getDistance(sourceToken, targetToken, {convertToFt: false}) / sourceToken.parent.grid.distance;
    const sequence = new Sequence();
    /* eslint-disable indent */
    if (cast) {
        sequence
            .effect()
                .file(orbit)
                .atLocation(sourceToken)
                .scaleToObject(1.75)
                .scaleIn(0, 1500, {ease: 'easeOutCubic'})
                .fadeIn(500)
                .startTime(5500)
                .zIndex(1)
            .effect()
                .file(base.burst)
                .atLocation(sourceToken)
                .scaleToObject(1.5)
                .scaleIn(0, 1500, {ease: 'easeOutCubic'})
                .fadeIn(500)
                .playbackRate(1.25)
                .fadeOut(250)
                .duration(2500)
            .wait(1500)
            .effect()
                .file(files.cast)
                .atLocation(sourceToken)
                .scaleToObject(1)
                .zIndex(3);
    }
    sequence
        .effect()
            .file(files.orb)
            .atLocation(sourceToken)
            .scaleToObject(1)
            .scaleIn(0, 500, {ease: 'easeOutBack'})
            .moveTowards(targetToken, {delay: 500, ease: 'easeInBack'})
            .missed(!landed)
            .fadeIn(250)
            .duration(travel)
            .zIndex(2)
        .effect()
            .file(base.trail)
            .atLocation(sourceToken)
            .scaleToObject(0.45)
            .moveTowards(targetToken, {delay: 500, ease: 'easeInBack'})
            .missed(!landed)
            .fadeIn(250)
            .duration(travel)
            .zIndex(1)
            .waitUntilFinished(-100)
        .effect()
            .file(files.hit)
            .atLocation(targetToken)
            .scaleToObject(1.25)
            .zIndex(3)
            .playIf(landed);
    /* eslint-enable indent */
    return sequence.play();
}
export const chromaticOrb = {
    name: 'CHRISPREMADES.Animations.ChromaticOrb',
    macros: {
        play
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            cast: partOption('Cast')
        };
    },
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
