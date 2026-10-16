import {animationUtils} from '../../../proxy.mjs';
import {pickFile} from '../generic/spellParts.mjs';
// Radiance gathers on the attacker, then crashes down on the target.
async function play(targetToken, options, {sourceToken} = {}) {
    const sequence = new Sequence();
    const width = sourceToken?.width ?? 1;
    if (sourceToken) {
        /* eslint-disable indent */
        sequence
            .effect()
                .delay(500)
                .file(pickFile('jb2a.particles.outward.white.02.03', 'jb2a.particles.outward.blue.01.03'))
                .attachTo(sourceToken, {offset: {y: -0.25}, gridUnits: true, followRotation: false})
                .scaleToObject(1.2)
                .playbackRate(2)
                .duration(2000)
                .fadeOut(800)
                .fadeIn(1000)
                .animateProperty('sprite', 'height', {from: 0, to: 2, duration: 3000, gridUnits: true, ease: 'easeOutBack'})
                .filter('Blur', {blurX: 0, blurY: 15})
                .zIndex(0.2)
            .effect()
                .delay(1050)
                .file(pickFile('jb2a.divine_smite.caster.reversed.yellowwhite', 'jb2a.divine_smite.caster.reversed.blueyellow'))
                .atLocation(sourceToken)
                .scaleToObject(2.2)
                .startTime(900)
                .fadeIn(200)
            .effect()
                .file(pickFile('jb2a.divine_smite.caster.yellowwhite', 'jb2a.divine_smite.caster.blueyellow'))
                .atLocation(sourceToken)
                .scaleToObject(1.85)
                .belowTokens()
                .waitUntilFinished(-1200);
        /* eslint-enable indent */
    }
    /* eslint-disable indent */
    sequence
        .canvasPan()
            .delay(300)
            .shake({duration: 1000, strength: 1, rotation: false, fadeOutDuration: 1000})
        .effect()
            .delay(300)
            .file(pickFile('jb2a.impact.ground_crack.orange.01', 'jb2a.impact.ground_crack.blue.01'))
            .atLocation(targetToken)
            .size(2.3 * width, {gridUnits: true})
            .belowTokens()
            .playbackRate(0.85)
            .randomRotation();
    const strike = sequence
        .effect()
            .file(pickFile('jb2a.divine_smite.target.yellowwhite', 'jb2a.divine_smite.target.blueyellow'))
            .atLocation(targetToken)
            .scaleToObject(3)
            .zIndex(2);
    /* eslint-enable indent */
    if (sourceToken) strike.rotateTowards(sourceToken).spriteOffset({x: -1.5 * width, y: 0}, {gridUnits: true}).mirrorY().rotate(90);
    await sequence.play();
}
export const divineSmite = {
    name: 'CHRISPREMADES.Animations.DivineSmite',
    macros: {
        play
    },
    inputs: ['targetToken'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
