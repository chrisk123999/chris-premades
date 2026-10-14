import {animationUtils, tokenUtils} from '../../../proxy.mjs';
import {colorOption, getPalette, partOption} from '../generic/spellParts.mjs';
const colorMap = {
    purple: 'Purple',
    blue: 'Blue'
};
const palettes = {
    patreon: {
        purple: {
            cast: 'jb2a.cast_generic.01.dark_purple.0',
            blade: 'jb2a.spiritual_weapon.longsword.01.dark.purple',
            swing: 'jb2a.sword.melee.01.purple',
            throw: 'jb2a.sword.throw.white',
            impact: 'jb2a.impact.007.purple'
        },
        blue: {
            cast: 'jb2a.cast_generic.01.blue.0',
            blade: 'jb2a.spiritual_weapon.longsword.01.dark.blue',
            swing: 'jb2a.sword.melee.01.blue',
            throw: 'jb2a.sword.throw.blue',
            impact: 'jb2a.impact.007.blue'
        }
    },
    free: {
        blue: {
            cast: 'jb2a.cast_generic.02.blue.0',
            swing: 'jb2a.sword.melee.01.white',
            impact: 'jb2a.impact.004.blue'
        }
    }
};
async function play(sourceToken, targetToken, {color = 'purple', impact = true, hit} = {}) {
    if (hit === undefined) return;
    const files = getPalette(palettes, color);
    if (!files) return;
    const thrown = files.throw && tokenUtils.getDistance(sourceToken, targetToken) > 5;
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file(thrown ? files.throw : files.swing)
            .atLocation(sourceToken)
            .stretchTo(targetToken)
            .missed(!hit)
            .zIndex(2)
            .waitUntilFinished(-600)
        .effect()
            .file(files.impact)
            .atLocation(targetToken)
            .scaleToObject(1)
            .randomRotation()
            .zIndex(3)
            .playIf(hit && impact)
        .play();
    /* eslint-enable indent */
}
async function create(effect, targetToken, {color = 'purple', cast = true} = {}) {
    const files = getPalette(palettes, color);
    if (!files) return;
    const sequence = new Sequence();
    /* eslint-disable indent */
    if (cast) {
        sequence
            .effect()
                .file(files.cast)
                .attachTo(targetToken)
                .scaleToObject(1.5)
                .waitUntilFinished(-750);
    }
    if (files.blade) {
        sequence
            .effect()
                .file(files.blade)
                .attachTo(targetToken)
                .scaleToObject(1)
                .fadeIn(250)
                .fadeOut(500)
                .duration(2000)
                .zIndex(2);
    }
    /* eslint-enable indent */
    await sequence.play();
}
export const shadowBlade = {
    name: 'CHRISPREMADES.Animations.ShadowBlade',
    macros: {
        play,
        create
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            color: colorOption(colorMap, ['blue'], {auto: false}),
            cast: partOption('Cast'),
            impact: partOption('Impact')
        };
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
