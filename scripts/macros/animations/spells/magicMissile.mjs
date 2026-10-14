import {animationUtils} from '../../../proxy.mjs';
const colorMap = {
    blue: 'Blue',
    green: 'Green',
    purple: 'Purple',
    yellow: 'Yellow',
    dark_red: 'DarkRed',
    orange: 'Orange',
    grey: 'Grey'
};
const starColors = {
    dark_red: 'orange',
    orange: 'orange',
    yellow: 'orange'
};
const arcSlots = [0, 1, -1, 2, -2, 3, -3];
const arcStep = 35;
const dynamicColors = Object.keys(colorMap);
let lastColor = Math.floor(Math.random() * dynamicColors.length);
let dartIndex = 0;
async function start() {
    dartIndex = 0;
    await animationUtils.preloadAnimations('jb2a.magic_missile');
}
function getArcOffset(sourceToken, targetToken) {
    const sourceCenter = sourceToken.object.center;
    const targetCenter = targetToken.object.center;
    const facing = Math.atan2(targetCenter.y - sourceCenter.y, targetCenter.x - sourceCenter.x);
    const angle = facing + Math.toRadians(arcSlots[dartIndex % arcSlots.length] * arcStep);
    const radius = sourceToken.width * 0.6;
    dartIndex++;
    return {x: Math.cos(angle) * radius, y: Math.sin(angle) * radius};
}
async function attack(sourceToken, targetToken, {missed, sound, color = 'purple'} = {}) {
    if (animationUtils.jb2aCheck() !== 'patreon') {
        color = 'purple';
    } else if (color === 'random') {
        color = dynamicColors[Math.floor(Math.random() * dynamicColors.length)];
    } else if (color === 'cycle') {
        color = dynamicColors[lastColor];
        lastColor = (lastColor + 1) % dynamicColors.length;
    }
    const offset = getArcOffset(sourceToken, targetToken);
    /* eslint-disable indent */
    new Sequence()
        .effect()
            .file('jb2a.twinkling_stars.points04.' + (starColors[color] ?? 'white'))
            .attachTo(sourceToken.object, {offset, gridUnits: true})
            .size(0.5, {gridUnits: true})
            .rotateTowards(targetToken.object)
            .spriteOffset({x: -0.25}, {gridUnits: true})
            .playbackRate(1.25)
            .rotateIn(180, 500, {ease: 'easeOutCubic'})
            .opacity(0.8)
            .zIndex(2)
        .sound()
            .playIf(sound)
            .file(sound)
        .wait(250)
        .effect()
            .file('jb2a.magic_missile.' + color)
            .attachTo(sourceToken.object, {offset, gridUnits: true})
            .scale(0.6)
            .stretchTo(targetToken.object, {randomOffset: 0.5})
            .randomizeMirrorY()
            .playbackRate(1.25)
            .missed(missed)
            .zIndex(1)
        .play();
    /* eslint-enable indent */
}
export const magicMissile = {
    name: 'CHRISPREMADES.Animations.MagicMissile',
    macros: {
        start,
        attack
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'rangedAttack',
    get config() {
        return {
            color: {
                default: 'purple',
                type: 'select',
                label: 'CHRISPREMADES.Config.Color',
                hint: 'CHRISPREMADES.Animations.MagicMissileColorHint',
                options: animationUtils.buildColorOptions(colorMap, {
                    freeColors: ['purple'],
                    requirements: ['jb2a_patreon'],
                    labelPrefix: 'CHRISPREMADES.Config.Colors.',
                    random: true,
                    cycle: true
                })
            },
            sound: {
                label: 'CHRISPREMADES.Config.Sound',
                hint: 'CHRISPREMADES.Config.SoundHint',
                type: 'file',
                fileType: 'audio',
                default: ''
            }
        };
    },
    get credits() { return [animationUtils.getCredits('eskie')]; }
};
