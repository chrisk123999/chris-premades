import {animationUtils} from '../../../proxy.mjs';
import {addImpact, addShake, getPalette} from '../generic/spellParts.mjs';
const strikes = {
    patreon: {
        blue: 'jb2a.unarmed_strike.physical.01.blue',
        orange: 'jb2a.unarmed_strike.physical.01.orange',
        purple: 'jb2a.unarmed_strike.magical.02.dark_purple'
    },
    free: {
        blue: 'jb2a.unarmed_strike.physical.01.blue',
        purple: 'jb2a.unarmed_strike.magical.02.blue'
    }
};
const projectiles = {
    patreon: {
        purple: 'jb2a.ranged.04.projectile.01.purple'
    },
    free: {
        purple: 'jb2a.ranged.03.projectile.01.bluegreen'
    }
};
const groundCracks = {
    patreon: {
        purple: 'jb2a.impact.ground_crack.purple.01'
    },
    free: {
        purple: 'jb2a.impact.ground_crack.orange.01'
    }
};
function addStrike(sequence, sourceToken, targetToken, color) {
    /* eslint-disable indent */
    sequence
        .effect()
            .file(getPalette(strikes, color))
            .atLocation(sourceToken)
            .stretchTo(targetToken)
            .zIndex(2)
            .waitUntilFinished(-600);
    /* eslint-enable indent */
}
async function playCombo(sourceToken, targetToken, {bonus = 2} = {}) {
    if (!animationUtils.jb2aCheck() || !sourceToken || !targetToken) return;
    const stage = Math.clamp(Math.round(bonus / 2), 1, 3);
    const sequence = new Sequence();
    addStrike(sequence, sourceToken, targetToken, 'orange');
    addImpact(sequence, targetToken, 'orange', {scale: 0.6 + 0.3 * stage});
    addShake(sequence, targetToken, {opacity: 0.25, duration: 300 * stage, playIf: stage > 1});
    await sequence.play();
}
async function playKnockOut(targetToken, _options, {sourceToken} = {}) {
    if (!animationUtils.jb2aCheck() || !targetToken) return;
    const sequence = new Sequence();
    if (sourceToken) addStrike(sequence, sourceToken, targetToken, 'purple');
    /* eslint-disable indent */
    sequence
        .canvasPan()
            .shake({duration: 600, strength: 2, rotation: false, fadeOutDuration: 400})
        .effect()
            .file(getPalette(groundCracks, 'purple'))
            .atLocation(targetToken)
            .scaleToObject(2)
            .belowTokens()
            .randomRotation();
    /* eslint-enable indent */
    addImpact(sequence, targetToken, 'purple', {scale: 1.6});
    addShake(sequence, targetToken, {duration: 1000});
    await sequence.play();
}
async function playEnergyBlast(sourceToken, targetToken, {saved} = {}) {
    if (!animationUtils.jb2aCheck() || !targetToken) return;
    const sequence = new Sequence();
    /* eslint-disable indent */
    if (sourceToken) {
        sequence
            .effect()
                .file('jb2a.extras.tmfx.outpulse.circle.01.normal')
                .atLocation(sourceToken)
                .scaleToObject(1.5)
                .opacity(0.6)
            .effect()
                .file(getPalette(projectiles, 'purple'))
                .atLocation(sourceToken)
                .stretchTo(targetToken)
                .zIndex(2)
                .waitUntilFinished(-500);
    }
    /* eslint-enable indent */
    addImpact(sequence, targetToken, 'purple', {scale: saved ? 0.8 : 1.4});
    addShake(sequence, targetToken, {opacity: 0.25, playIf: !saved});
    await sequence.play();
}
async function createAirDash(_effect, token) {
    if (!animationUtils.jb2aCheck()) return;
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file('jb2a.smoke.puff.ring.01.white')
            .atLocation(token)
            .scaleToObject(1.8)
            .belowTokens()
            .opacity(0.8)
        .effect()
            .file('jb2a.wind_stream.white')
            .atLocation(token)
            .scaleToObject(1.4)
            .rotate(90)
            .duration(1500)
            .fadeIn(200)
            .fadeOut(500)
            .opacity(0.7)
        .play();
    /* eslint-enable indent */
}
export const combo = {
    name: 'CHRISPREMADES.Animations.Combo',
    macros: {
        play: playCombo
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'classFeature',
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
export const knockOut = {
    name: 'CHRISPREMADES.Animations.KnockOut',
    macros: {
        play: playKnockOut
    },
    inputs: ['targetToken'],
    requirements: ['JB2A_DnD5e'],
    category: 'classFeature',
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
export const energyBlast = {
    name: 'CHRISPREMADES.Animations.EnergyBlast',
    macros: {
        play: playEnergyBlast
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'classFeature',
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
export const airDash = {
    name: 'CHRISPREMADES.Animations.AirDash',
    macros: {
        create: createAirDash
    },
    inputs: ['targetToken'],
    requirements: ['JB2A_DnD5e'],
    category: 'classFeature',
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
