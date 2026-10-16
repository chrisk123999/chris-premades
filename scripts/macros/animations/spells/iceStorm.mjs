import {animationUtils, regionUtils} from '../../../proxy.mjs';
import {addCast, addImpact, addShake, casts, getPalette, partOption, persistName} from '../generic/spellParts.mjs';
function randomPoint(area) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.sqrt(Math.random()) * area.radius * 0.9;
    return {x: area.x + Math.cos(angle) * distance, y: area.y + Math.sin(angle) * distance};
}
async function play(sourceToken, region, {cast = true, impact = true, targets = []} = {}) {
    if (!region) return;
    const area = regionUtils.getArea(region);
    const center = {x: area.x, y: area.y};
    const isPatreon = animationUtils.jb2aCheck() === 'patreon';
    const drop = 7 * region.parent.grid.size;
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, center, {file: getPalette(casts, 'blue'), wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.magic_signs.circle.02.evocation.loop.blue')
            .atLocation(center)
            .size(area.radius * 2)
            .scaleIn(0, 500, {ease: 'easeOutCubic'})
            .fadeIn(750)
            .fadeOut(1000)
            .duration(6000)
            .belowTokens()
            .zIndex(0.1)
            .playIf(isPatreon)
        .effect()
            .file('jb2a.extras.tmfx.border.circle.outpulse.01.fast')
            .atLocation(center)
            .size(area.radius * 2.6)
            .scaleIn(0, 500, {ease: 'easeOutQuint'})
            .delay(400)
            .duration(1000)
            .fadeOut(1000)
            .zIndex(1)
            .playIf(isPatreon)
        .effect()
            .name(persistName('iceStorm', region))
            .file('jb2a.sleet_storm.blue')
            .atLocation(center)
            .size(area.radius * 2.1)
            .delay(500)
            .fadeIn(3000)
            .fadeOut(1000)
            .belowTokens()
            .persist()
            .tieToDocuments(region)
        .effect()
            .file('jb2a.smoke.ring.01.white')
            .atLocation(center)
            .size(area.radius * 2.6)
            .delay(500)
            .fadeIn(2000)
            .fadeOut(1000)
            .duration(5000)
            .opacity(0.2)
            .zIndex(1)
            .playIf(isPatreon);
    for (let index = 0; index < 24; index++) {
        const point = randomPoint(area);
        sequence
            .effect()
                .file('jb2a.spell_projectile.ice_shard')
                .delay(500 + index * 150)
                .atLocation({x: point.x, y: point.y - drop})
                .stretchTo(point)
                .zIndex(6);
    }
    /* eslint-enable indent */
    if (impact) {
        sequence.wait(1200);
        targets.filter(target => target.saved !== true).forEach(target => {
            addShake(sequence, target.token, {duration: 1500});
            addImpact(sequence, target.token, 'blue', {scale: 1.5});
        });
    }
    await sequence.play();
}
export const iceStorm = {
    name: 'CHRISPREMADES.Animations.IceStorm',
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
