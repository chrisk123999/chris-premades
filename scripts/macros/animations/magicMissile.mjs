import {animationUtils} from '../../proxy.mjs';
const colorMap = {
    blue: 'Blue',
    green: 'Green',
    purple: 'Purple',
    yellow: 'Yellow',
    dark_red: 'DarkRed',
    orange: 'Orange',
    grey: 'Grey'
};
const dynamicColors = Object.keys(colorMap);
let lastColor = Math.floor(Math.random() * dynamicColors.length);
async function attack(sourceToken, targetToken, {missed, sound, color = 'purple'} = {}) {
    await animationUtils.preloadAnimations('jb2a.magic_missile');
    if (color === 'random') {
        color = dynamicColors[Math.floor(Math.random() * dynamicColors.length)];
    } else if (color === 'cycle') {
        color = dynamicColors[lastColor];
        lastColor = (lastColor + 1) % dynamicColors.length;
    }
    const path = 'jb2a.magic_missile.' + color;
    /* eslint-disable indent */
    new Sequence()
        .effect()
            .file(path)
            .atLocation(sourceToken.object)
            .stretchTo(targetToken.object)
            .randomizeMirrorY()
            .missed(missed)
        .sound()
            .playIf(sound)
            .file(sound)
        .play();
    /* eslint-enable indent */
}
export const magicMissile = {
    name: 'CHRISPREMADES.Animations.MagicMissile',
    macros: {
        attack
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    type: 'rangedAttack',
    get config() {
        return {
            color: {
                default: 'purple',
                type: 'select',
                label: 'CHRISPREMADES.Config.Generic.Color',
                options: animationUtils.buildColorOptions(colorMap, {
                    freeColors: ['purple'],
                    labelPrefix: 'CHRISPREMADES.Config.Colors.'
                })
            },
            sound: {
                label: 'CHRISPREMADES.Config.Generic.Sound',
                type: 'text',
                default: ''
            }
        };
    }
};