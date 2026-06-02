
import {animationUtils} from '../../proxy.mjs';
const colors = [ 'grey', 'dark_red', 'orange', 'yellow', 'green', 'blue', 'purple'];
let lastColor = Math.floor((Math.random() * colors.length));
const basePath = 'jb2a.magic_missile.';
async function macro(sourceToken, targetToken, missed, sound, color) {
    await animationUtils.preloadAnimations('jb2a.magic_missile');
    let path = basePath;
    if (color === 'random') {
        path += colors[Math.floor(Math.random() * colors.length)];
    } else if (color === 'cycle') {
        path += colors[lastColor];
        lastColor++;
        if (lastColor >= colors.length) lastColor = 0;
    } else {
        path += color;
    }
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
    name: 'Magic Missile',
    macro,
    requirements: ['JB2A_DnD5e'],
    type: 'rangedAttack',
    config: {
        color: {
            default: 'purple',
            type: 'select',
            label: 'CHRISPREMADES.Config.Generic.Color',
            options: {
                blue: {
                    label: 'CHRISPREMADES.Config.Colors.Blue',
                    requirements: ['jb2a_patreon']
                },
                green: {
                    label: 'CHRISPREMADES.Config.Colors.Green',
                    requirements: ['jb2a_patreon']
                },
                purple: {
                    label: 'CHRISPREMADES.Config.Colors.Purple'
                },
                yellow: {
                    label: 'CHRISPREMADES.Config.Colors.Yellow',
                    requirements: ['jb2a_patreon']
                },
                dark_red: {
                    label: 'CHRISPREMADES.Config.Colors.DarkRed',
                    requirements: ['jb2a_patreon']
                },
                orange: {
                    label: 'CHRISPREMADES.Config.Colors.Orange',
                    requirements: ['jb2a_patreon']
                },
                grey: {
                    label: 'CHRISPREMADES.Config.Colors.Grey',
                    requirements: ['jb2a_patreon']
                },
                random: {
                    label: 'CHRISPREMADES.Config.Colors.Random',
                    requirements: ['jb2a_patreon']
                },
                cycle: {
                    label: 'CHRISPREMADES.Config.Colors.Cycle',
                    requirements: ['jb2a_patreon']
                }
            }
        },
        sound: {
            label: 'CHRISPREMADES.Config.Generic.Sound',
            type: 'text',
            default: ''
        }
    }
};