import {animationUtils} from '../../../proxy.mjs';
import {endPersist, persistName} from '../generic/spellParts.mjs';
const crownColors = {
    blue: 'Blue',
    green: 'Green',
    greenorange: 'GreenOrange',
    orangepurple: 'OrangePurple',
    purplegreen: 'PurpleGreen',
    yellowblue: 'YellowBlue'
};
const boltColors = {
    bluegreen: 'BlueGreen',
    pinkpurple: 'PinkPurple',
    yellow: 'Yellow'
};
function pickColor(color, colors, free) {
    if (animationUtils.jb2aCheck() !== 'patreon') return free;
    if (color === 'random') return colors[Math.floor(Math.random() * colors.length)];
    return colors.includes(color) ? color : free;
}
async function create(effect, targetToken, {crownColor = 'blue', sound} = {}) {
    const color = pickColor(crownColor, Object.keys(crownColors), 'blue');
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .name(persistName('crownOfStars', effect))
            .file('jb2a.markers.circle_of_stars.' + color)
            .attachTo(targetToken)
            .scaleToObject(2)
            .fadeIn(500)
            .fadeOut(500)
            .persist()
            .tieToDocuments(effect)
        .sound()
            .file(sound)
            .playIf(!!sound)
        .play();
    /* eslint-enable indent */
}
async function play(sourceToken, targetToken, {boltColor = 'bluegreen', boltSound, hit} = {}) {
    if (!sourceToken) return;
    const color = pickColor(boltColor, Object.keys(boltColors), 'bluegreen');
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file('jb2a.ranged.03.instant.01.' + color)
            .atLocation(sourceToken)
            .stretchTo(targetToken)
            .missed(hit === false)
        .sound()
            .file(boltSound)
            .playIf(!!boltSound)
        .play();
    /* eslint-enable indent */
}
export const crownOfStars = {
    name: 'CHRISPREMADES.Animations.CrownOfStars',
    macros: {
        create,
        delete: endPersist('crownOfStars'),
        play
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            crownColor: {
                default: 'blue',
                type: 'select',
                label: 'CHRISPREMADES.Animations.CrownOfStarsCrownColor',
                options: animationUtils.buildColorOptions(crownColors, {freeColors: ['blue'], requirements: ['jb2a_patreon'], labelPrefix: 'CHRISPREMADES.Config.Colors.', random: true})
            },
            boltColor: {
                default: 'bluegreen',
                type: 'select',
                label: 'CHRISPREMADES.Animations.CrownOfStarsBoltColor',
                options: animationUtils.buildColorOptions(boltColors, {freeColors: ['bluegreen'], requirements: ['jb2a_patreon'], labelPrefix: 'CHRISPREMADES.Config.Colors.', random: true})
            },
            sound: {
                default: '',
                type: 'file',
                label: 'CHRISPREMADES.Config.TokenSound'
            },
            boltSound: {
                default: '',
                type: 'file',
                label: 'CHRISPREMADES.Config.Sound'
            }
        };
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
