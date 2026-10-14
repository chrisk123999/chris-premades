import {animationUtils} from '../../../proxy.mjs';
import {addShake, persistName} from '../generic/spellParts.mjs';
async function play(sourceToken, targetToken) {
    const sequence = new Sequence();
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.impact.frost.white.01')
            .atLocation(sourceToken)
            .rotateTowards(targetToken)
            .scaleToObject(1.45)
            .spriteScale({x: 0.75, y: 1.0})
            .spriteOffset({x: -0.15}, {gridUnits: true})
        .effect()
            .file('jb2a.side_impact.part.fast.ice_shard.blue')
            .atLocation(sourceToken)
            .rotateTowards(targetToken)
            .scaleToObject(2)
            .randomizeMirrorY()
            .zIndex(2);
    /* eslint-enable indent */
    addShake(sequence, targetToken, {opacity: 0.15, duration: 500, fadeIn: 100, fadeOut: 100});
    await sequence.play();
}
async function create(effect, token) {
    const patreon = animationUtils.jb2aCheck() === 'patreon';
    const name = persistName('armorOfAgathys', effect);
    const sequence = new Sequence();
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.magic_signs.circle.02.abjuration.complete.blue')
            .atLocation(token)
            .scaleToObject(1.85)
            .belowTokens()
            .fadeOut(3000)
            .scaleIn(0, 500, {ease: 'easeOutCubic'});
    if (patreon) {
        sequence
            .effect()
                .file('jb2a.magic_signs.rune.02.complete.06.blue')
                .attachTo(token)
                .delay(250)
                .scaleToObject(0.75, {considerTokenScale: true})
                .scaleIn(0, 500, {ease: 'easeOutCubic'})
                .playbackRate(2.5)
                .zIndex(3);
    }
    sequence
        .effect()
            .file('jb2a.extras.tmfx.border.circle.inpulse.01.' + (patreon ? 'fast' : 'normal'))
            .attachTo(token)
            .scaleToObject(1.5, {considerTokenScale: true})
            .zIndex(3)
        .effect()
            .name(name)
            .file('jb2a.extras.tmfx.inflow.circle.01')
            .attachTo(token)
            .scaleToObject(1, {considerTokenScale: true})
            .randomRotation()
            .fadeIn(1500)
            .fadeOut(500)
            .opacity(0.9)
            .zIndex(2)
            .extraEndDuration(1500)
            .persist()
            .tieToDocuments(effect)
        .effect()
            .name(name)
            .file('jb2a.extras.tmfx.outflow.circle.01')
            .attachTo(token)
            .scaleToObject(1.35, {considerTokenScale: true})
            .randomRotation()
            .fadeIn(1500)
            .fadeOut(500)
            .scaleIn(0, 1500, {ease: 'easeOutCubic'})
            .belowTokens()
            .opacity(0.9)
            .zIndex(1)
            .extraEndDuration(1500)
            .persist()
            .tieToDocuments(effect)
        .effect()
            .name(name)
            .file('jb2a.template_circle.symbol.normal.snowflake.blue')
            .attachTo(token)
            .scaleToObject(1.35, {considerTokenScale: true})
            .randomRotation()
            .fadeIn(1500)
            .fadeOut(500)
            .scaleIn(0, 1500, {ease: 'easeOutCubic'})
            .belowTokens()
            .opacity(0.75)
            .zIndex(2)
            .extraEndDuration(1500)
            .persist()
            .tieToDocuments(effect)
        .effect()
            .name(name)
            .file('jb2a.shield.01.loop.blue')
            .attachTo(token)
            .scaleToObject(1.5, {considerTokenScale: true})
            .fadeIn(1500)
            .fadeOut(500)
            .opacity(0.75)
            .zIndex(1)
            .persist()
            .tieToDocuments(effect);
    /* eslint-enable indent */
    await sequence.play();
}
async function remove(effect, token) {
    await Sequencer.EffectManager.endEffects({name: persistName('armorOfAgathys', effect), object: token});
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file('jb2a.shield.01.outro_explode.blue')
            .attachTo(token)
            .scaleToObject(1.5, {considerTokenScale: true})
            .fadeOut(500)
            .opacity(0.75)
            .zIndex(1)
        .play();
    /* eslint-enable indent */
}
export const armorOfAgathys = {
    name: 'CHRISPREMADES.Animations.ArmorOfAgathys',
    macros: {
        play,
        create,
        delete: remove
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
