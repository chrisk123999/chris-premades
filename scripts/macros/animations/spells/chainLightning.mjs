import {animationUtils} from '../../../proxy.mjs';
import {addShake, colorOption} from '../generic/spellParts.mjs';
const colorMap = {
    blue: 'Blue',
    blue02: 'Blue02',
    dark_purple: 'DarkPurple',
    dark_red: 'DarkRed',
    green: 'Green',
    green02: 'Green02',
    orange: 'Orange',
    purple: 'Purple',
    red: 'Red',
    yellow: 'Yellow'
};
function addArc(sequence, from, to, file) {
    /* eslint-disable indent */
    sequence
        .effect()
            .delay(150)
            .file(file)
            .atLocation(from)
            .stretchTo(to, {onlyX: true})
            .duration(1000)
            .fadeIn(250)
            .fadeOut(750)
            .belowTokens()
            .animateProperty('sprite', 'height', {from: -2, to: -1, duration: 200, gridUnits: true})
            .opacity(0.75)
            .randomizeMirrorY()
            .playIf(!!file);
    /* eslint-enable indent */
}
async function play(sourceToken, targetToken, {leaps = [], color = 'blue'} = {}) {
    const tier = animationUtils.jb2aCheck();
    if (!targetToken || !tier) return;
    const isPatreon = tier === 'patreon';
    const chain = 'jb2a.chain_lightning.{part}.' + (isPatreon ? color : 'blue');
    const arc = ['blue', 'blue02'].includes(color) ? (isPatreon ? 'jb2a.electric_arc.blue02' : 'jb2a.electric_arc') : undefined;
    const self = !sourceToken || sourceToken === targetToken;
    const sequence = new Sequence();
    if (!self) addArc(sequence, sourceToken, targetToken, arc);
    sequence.thenDo(() => {
        const arcs = new Sequence();
        leaps.forEach(leap => addArc(arcs, targetToken, leap, arc));
        if (leaps.length) arcs.play();
    });
    /* eslint-disable indent */
    if (self) {
        sequence
            .effect()
                .file('jb2a.static_electricity.01.blue')
                .atLocation(targetToken)
                .scaleToObject(1.5)
                .waitUntilFinished(-1250);
    } else {
        sequence
            .effect()
                .delay(150)
                .file(chain.replace('{part}', 'primary'))
                .atLocation(sourceToken, {offset: {x: sourceToken.width * 0.25}, gridUnits: true, local: true})
                .stretchTo(targetToken)
                .zIndex(2)
                .waitUntilFinished(-1150);
    }
    /* eslint-enable indent */
    addShake(sequence, targetToken, {opacity: 0.25, duration: 2000, fadeIn: 250, fadeOut: 1250});
    sequence.thenDo(() => {
        if (!leaps.length) return;
        const bolts = new Sequence();
        for (const leap of leaps) {
            /* eslint-disable indent */
            bolts
                .effect()
                    .file(chain.replace('{part}', 'secondary'))
                    .atLocation(targetToken, {offset: {x: -0.1}, gridUnits: true, local: true})
                    .stretchTo(leap)
                    .randomizeMirrorY()
                    .zIndex(2);
            /* eslint-enable indent */
            addShake(bolts, leap, {opacity: 0.25, duration: 2000, fadeIn: 250, fadeOut: 1250});
        }
        bolts.play();
    });
    return sequence.play({preload: true});
}
export const chainLightning = {
    name: 'CHRISPREMADES.Animations.ChainLightning',
    macros: {
        play
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {color: colorOption(colorMap, ['blue'], {auto: false})};
    },
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
