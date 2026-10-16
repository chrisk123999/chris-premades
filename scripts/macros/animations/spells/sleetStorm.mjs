import {animationUtils, regionUtils} from '../../../proxy.mjs';
import {addCast, casts, colorOption, getPalette, pickFile} from '../generic/spellParts.mjs';
import {addFill} from '../generic/wallParts.mjs';
const colorMap = {
    blue: 'Blue',
    grey: 'Grey',
    green: 'Green',
    purple: 'Purple',
    yellow: 'Yellow'
};
// Freezing sleet falls across the area for the duration.
async function play(sourceToken, region, {color = 'blue', cast = true} = {}) {
    if (!region) return;
    const area = regionUtils.getArea(region);
    const center = {x: area.x, y: area.y};
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, center, {file: getPalette(casts, color), wait: -750});
    addFill(sequence, region, pickFile('jb2a.sleet_storm.01.' + color, 'jb2a.sleet_storm.01.blue', 'jb2a.sleet_storm.blue'), {prefix: 'sleetStorm', belowTokens: false, fadeIn: 1500});
    await sequence.play();
}
export const sleetStorm = {
    name: 'CHRISPREMADES.Animations.SleetStorm',
    macros: {
        play
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {color: colorOption(colorMap, ['blue'], {auto: false})};
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
