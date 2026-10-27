import {pickFile} from '../generic/spellParts.mjs';
function daosCrush(sequence, targets) {
    const boulder = pickFile('jb2a.impact.boulder.01');
    targets.forEach(target => {
        /* eslint-disable indent */
        sequence
            .effect()
                .file('jb2a.impact.ground_crack.orange.02')
                .atLocation(target)
                .scaleToObject(2)
                .belowTokens();
        if (boulder) sequence
            .effect()
                .file(boulder)
                .atLocation(target)
                .scaleToObject(1.5)
                .delay(200);
        /* eslint-enable indent */
    });
}
function djinnisEscape(sequence, sourceToken) {
    /* eslint-disable indent */
    sequence
        .effect()
            .file(pickFile('jb2a.whirlwind.bluewhite', 'jb2a.whirlwind.bluegrey'))
            .atLocation(sourceToken)
            .scaleToObject(1.75)
            .duration(1500)
            .fadeIn(200)
            .fadeOut(500)
            .belowTokens()
        .effect()
            .file('jb2a.wind_stream.white')
            .atLocation(sourceToken)
            .scaleToObject(1.25)
            .duration(1200)
            .opacity(0.6)
            .fadeOut(400);
    /* eslint-enable indent */
}
function efreetisFury(sequence, [target, ...others]) {
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.explosion.01.orange')
            .atLocation(target)
            .scaleToObject(1.75)
            .waitUntilFinished(-600);
    others.forEach(other => {
        sequence
            .effect()
                .file('jb2a.fire_bolt.orange')
                .atLocation(target)
                .stretchTo(other)
                .waitUntilFinished(-400)
            .effect()
                .file('jb2a.explosion.01.orange')
                .atLocation(other)
                .scaleToObject(1.75);
    });
    /* eslint-enable indent */
}
function maridsSurge(sequence, sourceToken, targets) {
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.water_splash.circle.01.blue')
            .atLocation(sourceToken)
            .size(sourceToken.width + 4, {gridUnits: true})
            .belowTokens()
            .waitUntilFinished(-1000);
    targets.forEach(target => {
        sequence
            .effect()
                .file('jb2a.liquid.splash.blue')
                .atLocation(target)
                .scaleToObject(1.5);
    });
    /* eslint-enable indent */
}
async function play(sourceToken, targets, strike) {
    const sequence = new Sequence();
    switch (strike) {
        case 'daos-crush': daosCrush(sequence, targets); break;
        case 'djinnis-escape': djinnisEscape(sequence, sourceToken); break;
        case 'efreetis-fury': efreetisFury(sequence, targets); break;
        case 'marids-surge': maridsSurge(sequence, sourceToken, targets); break;
        default: return;
    }
    await sequence.play();
}
export const elementalStrike = {
    name: 'CHRISPREMADES.Animations.ElementalStrike',
    macros: {
        play
    },
    inputs: ['sourceToken', 'targetTokens', 'strike'],
    requirements: ['JB2A_DnD5e'],
    category: 'attack'
};
