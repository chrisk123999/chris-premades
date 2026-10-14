import {getAreaGeometry} from '../generic/castArea.mjs';
async function play(sourceToken, region, {targets = [], radius} = {}) {
    const geometry = getAreaGeometry(sourceToken, region, {radius});
    if (!geometry.end) return;
    const sequence = new Sequence();
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.cone_of_cold.blue')
            .atLocation(geometry.origin)
            .stretchTo(geometry.end)
            .playbackRate(0.7)
            .belowTokens()
            .waitUntilFinished(-5000);
    targets.forEach(target => {
        sequence
            .effect()
                .file('jb2a.markers.snowflake.blue.01')
                .atLocation(target.token)
                .scaleToObject(1.5)
                .delay(150)
                .fadeIn(500)
                .fadeOut(500)
                .playbackRate(2);
    });
    sequence.wait(2000);
    targets.forEach(target => {
        if (target.saved === false) {
            sequence
                .effect()
                    .file('jb2a.impact_themed.ice_shard.blue')
                    .atLocation(target.token)
                    .scaleToObject(1.5)
                    .delay(200)
                    .playbackRate(0.75);
        } else if (target.saved) {
            sequence
                .effect()
                    .file('jb2a.energy_field.02.above.blue')
                    .atLocation(target.token)
                    .duration(3000)
                    .startTime(1200)
                    .scaleToObject(1)
                    .playbackRate(2);
        }
    });
    /* eslint-enable indent */
    await sequence.play();
}
export const frostFingers = {
    name: 'CHRISPREMADES.Animations.FrostFingers',
    macros: {
        play
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell'
};
