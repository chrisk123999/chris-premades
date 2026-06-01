
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
    type: 'rangedAttack'
};