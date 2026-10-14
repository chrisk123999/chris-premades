import {animationUtils} from '../../../proxy.mjs';
import {addImpact, colorOption} from '../generic/spellParts.mjs';
const colorMap = {
    bluegreen: 'BlueGreen',
    pinkpurple: 'PinkPurple',
    yellow: 'Yellow'
};
const impactColors = {
    bluegreen: 'blue',
    pinkpurple: 'pink',
    yellow: 'yellow'
};
const dynamicColors = Object.keys(colorMap);
async function attack(sourceToken, targetToken, {missed, sound, color = 'bluegreen'} = {}) {
    await animationUtils.preloadAnimations('jb2a.ranged.03.projectile.01');
    if (animationUtils.jb2aCheck() !== 'patreon') {
        color = 'bluegreen';
    } else if (color === 'random') {
        color = dynamicColors[Math.floor(Math.random() * dynamicColors.length)];
    }
    const sequence = new Sequence();
    /* eslint-disable indent */
    sequence
        .sound()
            .playIf(sound)
            .file(sound)
        .effect()
            .file('jb2a.ranged.03.projectile.01.' + color)
            .atLocation(sourceToken)
            .stretchTo(targetToken)
            .missed(missed)
            .waitUntilFinished(-500);
    /* eslint-enable indent */
    addImpact(sequence, targetToken, impactColors[color], {playIf: !missed});
    return sequence.play();
}
export const spellfireFlare = {
    name: 'CHRISPREMADES.Animations.SpellfireFlare',
    macros: {
        attack
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'rangedAttack',
    get config() {
        return {
            color: colorOption(colorMap, ['bluegreen'], {auto: false, random: true, hint: 'CHRISPREMADES.Animations.SpellfireFlareColorHint'}),
            sound: {
                label: 'CHRISPREMADES.Config.Sound',
                hint: 'CHRISPREMADES.Config.SoundHint',
                type: 'file',
                fileType: 'audio',
                default: ''
            }
        };
    }
};
