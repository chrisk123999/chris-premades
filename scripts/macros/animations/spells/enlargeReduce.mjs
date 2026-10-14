import {animationUtils} from '../../../proxy.mjs';
import {getPalette} from '../generic/spellParts.mjs';
const palettes = {
    patreon: {
        default: {
            static: 'jb2a.static_electricity.03.orange',
            pulse: 'jb2a.extras.tmfx.outpulse.circle.01.fast',
            crack: 'jb2a.impact.ground_crack.orange.02',
            strands: 'jb2a.energy_strands.in.yellow.01.2',
            particles: 'jb2a.particles.outward.orange.01.04'
        }
    },
    free: {
        default: {
            static: 'jb2a.static_electricity.03.blue',
            pulse: 'jb2a.extras.tmfx.border.circle.outpulse.01.normal',
            crack: 'jb2a.impact.ground_crack.orange.02',
            strands: 'jb2a.energy_strands.in.green.01.2',
            particles: 'jb2a.particles.outward.greenyellow.01.04'
        }
    }
};
async function play(token, {enlarge = true, preScale = 1, postScale = 1, callback} = {}) {
    const files = getPalette(palettes, 'default');
    if (!files) return;
    const wobble = enlarge ? {property: 'position.x', range: 40} : {property: 'rotation', range: 10};
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file(files.static)
            .atLocation(token)
            .duration(3000)
            .scaleToObject(1)
            .fadeIn(250)
            .fadeOut(250)
            .zIndex(2)
        .effect()
            .copySprite(token)
            .atLocation(token)
            .scaleToObject(2)
            .duration(500)
            .scaleIn(0.25, 500)
            .fadeIn(250)
            .fadeOut(250)
            .repeats(3, 500, 500)
            .opacity(0.2)
            .zIndex(1)
        .animation()
            .on(token)
            .opacity(0)
        .effect()
            .copySprite(token)
            .atLocation(token)
            .loopProperty('sprite', wobble.property, {from: -wobble.range, to: wobble.range, duration: 75, pingPong: true, delay: 200})
            .scaleToObject(preScale)
            .duration(2000)
            .waitUntilFinished(-200)
            .zIndex(0)
        .thenDo(callback)
        .wait(200)
        .effect()
            .copySprite(token)
            .atLocation(token)
            .scaleToObject(postScale)
            .duration(3000)
            .scaleIn(0.25, 700, {ease: 'easeOutBounce'})
        .effect()
            .file(files.pulse)
            .atLocation(token)
            .belowTokens(enlarge)
            .opacity(0.75)
            .scaleToObject(2)
            .zIndex(1)
        .effect()
            .file(enlarge ? files.crack : files.strands)
            .atLocation(token)
            .belowTokens()
            .scaleToObject(2)
            .zIndex(0)
        .effect()
            .file(files.particles)
            .scaleIn(0.25, 500, {ease: 'easeOutQuint'})
            .fadeIn(500)
            .fadeOut(1000)
            .atLocation(token)
            .randomRotation()
            .duration(3000)
            .scaleToObject(1.5)
            .zIndex(4)
        .effect()
            .file(files.static)
            .atLocation(token)
            .duration(5000)
            .scaleToObject(1)
            .fadeIn(250)
            .fadeOut(250)
            .waitUntilFinished(-3000)
        .animation()
            .on(token)
            .opacity(1)
        .play();
    /* eslint-enable indent */
}
export const enlargeReduce = {
    name: 'CHRISPREMADES.Animations.EnlargeReduce',
    macros: {
        play
    },
    inputs: ['token', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
