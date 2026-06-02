import {animationUtils} from '../../proxy.mjs';
const colorMap = {
    purple: 'Purple',
    dark_green: 'DarkGreen',
    dark_pink: 'DarkPink',
    dark_purple: 'DarkPurple',
    dark_red: 'DarkRed',
    green: 'Green',
    lightblue: 'LightBlue',
    lightgreen: 'LightGreen',
    orange: 'Orange',
    pink: 'Pink',
    yellow: 'Yellow',
    rainbow: 'Rainbow'
};
const dynamicColors = Object.keys(colorMap).filter(c => c !== 'rainbow');
let lastColor = Math.floor(Math.random() * dynamicColors.length);
async function macro(sourceToken, targetToken, {missed, sound, color = 'purple'} = {}) {
    await animationUtils.preloadAnimations('jb2a.eldritch_blast');
    if (color === 'random') {
        color = dynamicColors[Math.floor(Math.random() * dynamicColors.length)];
    } else if (color === 'cycle') {
        color = dynamicColors[lastColor];
        lastColor = (lastColor + 1) % dynamicColors.length; 
    }
    const path = 'jb2a.eldritch_blast.' + color;
    return await animationUtils.simpleAttack(sourceToken, targetToken, path, {missed, sound});
}
export const eldritchBlast = {
    name: 'CHRISPREMADES.Animations.EldritchBlast',
    macro,
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