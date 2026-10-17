import {animationUtils, effectUtils, regionUtils} from '../../../proxy.mjs';
import {addImpact, partOption, persistName} from '../generic/spellParts.mjs';
function addStorm(sequence, sourceToken, center, concentration, {cast, size}) {
    const isPatreon = animationUtils.jb2aCheck() === 'patreon';
    /* eslint-disable indent */
    if (cast && sourceToken) {
        sequence
            .effect()
                .file('jb2a.magic_signs.circle.02.conjuration.loop.purple')
                .attachTo(sourceToken)
                .scaleToObject(1.25)
                .rotateIn(180, 600, {ease: 'easeOutCubic'})
                .scaleIn(0, 600, {ease: 'easeOutCubic'})
                .belowTokens()
                .duration(2500)
                .fadeOut(1000)
                .playIf(isPatreon)
            .effect()
                .file('jb2a.static_electricity.03.blue')
                .attachTo(sourceToken)
                .scaleToObject(1.5)
                .duration(2500)
                .fadeOut(1000)
            .wait(1000);
    }
    sequence
        .effect()
            .name(persistName('callLightning', concentration))
            .file('jb2a.call_lightning.high_res.blue')
            .atLocation(center)
            .size(size)
            .opacity(0.5)
            .fadeIn(3000)
            .scaleIn(0, 3000, {ease: 'easeOutSine'})
            .fadeOut(3000)
            .belowTokens()
            .persist()
            .tieToDocuments(concentration);
    /* eslint-enable indent */
}
function addBolt(sequence, center, grid, {impact, targets}) {
    const isPatreon = animationUtils.jb2aCheck() === 'patreon';
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.lightning_strike.blue')
            .atLocation(center)
            .size(2.5 * grid)
            .zIndex(100)
        .canvasPan()
            .delay(250)
            .shake({duration: 1000, strength: 2, rotation: false, fadeOut: 500})
        .effect()
            .delay(250)
            .file(isPatreon ? 'jb2a.impact.ground_crack.blue.01' : 'jb2a.impact.ground_crack.still_frame.01')
            .atLocation(center)
            .size(4 * grid)
            .randomRotation()
            .belowTokens();
    /* eslint-enable indent */
    if (impact) targets.filter(target => target.saved !== true).forEach(target => addImpact(sequence, target.token, 'blue'));
}
async function play(sourceToken, region, {cast = true, impact = true, targets = []} = {}) {
    const activity = region ? regionUtils.getActivity(region) : undefined;
    if (!activity) return;
    const area = regionUtils.getArea(region);
    const center = {x: area.x, y: area.y};
    const concentration = effectUtils.getConcentrationEffect(activity.actor, activity.item);
    const sequence = new Sequence();
    if (concentration && !Sequencer.EffectManager.getEffects({name: persistName('callLightning', concentration)}).length) addStorm(sequence, sourceToken, center, concentration, {cast, size: 120 * region.parent.dimensions.distancePixels});
    addBolt(sequence, center, region.parent.grid.size, {impact, targets});
    await sequence.play();
}
export const callLightning = {
    name: 'CHRISPREMADES.Animations.CallLightning',
    macros: {
        play
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    config: {
        cast: partOption('Cast'),
        impact: partOption('Impact')
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
