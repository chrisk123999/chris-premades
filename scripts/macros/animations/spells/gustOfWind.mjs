import {animationUtils} from '../../../proxy.mjs';
import {getAreaGeometry} from '../generic/castArea.mjs';
import {addCast, casts, getPalette, partOption} from '../generic/spellParts.mjs';
async function play(sourceToken, region, {cast = true} = {}) {
    if (!region || !animationUtils.jb2aCheck()) return;
    const geometry = getAreaGeometry(sourceToken, region);
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, geometry.center, {file: getPalette(casts, 'grey'), wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .name('gustOfWind ' + region.uuid)
            .file('jb2a.gust_of_wind.default')
            .attachTo(region)
            .stretchTo(region, {attachTo: true})
            .opacity(0.8)
            .fadeIn(500)
            .fadeOut(500)
            .belowTokens()
            .persist()
            .tieToDocuments(region);
    /* eslint-enable indent */
    await sequence.play();
}
export const gustOfWind = {
    name: 'CHRISPREMADES.Animations.GustOfWind.Name',
    macros: {
        play
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    config: {
        cast: partOption('Cast')
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
