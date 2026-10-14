import {animationUtils} from '../../../proxy.mjs';
import {colorOption, getPalette, partOption} from '../generic/spellParts.mjs';
const colorMap = {
    orange: 'Orange',
    blue: 'Blue',
    green: 'Green',
    purple: 'Purple',
    red: 'Red',
    yellow: 'Yellow'
};
const patreonFlames = {blue: 'blue', green: 'green', purple: 'purple', red: 'orange', yellow: 'orange', orange: 'orange'};
const palettes = {
    patreon: Object.fromEntries(Object.keys(colorMap).map(color => [color, {
        cast: 'jb2a.cast_generic.fire.01.orange.0',
        blade: 'jb2a.spiritual_weapon.sword.flaming.' + color,
        swing: 'jb2a.sword.melee.fire.' + color,
        flames: 'jb2a.flames.01.' + patreonFlames[color],
        impact: 'jb2a.impact.007.' + color
    }])),
    free: {
        orange: {
            cast: 'jb2a.cast_generic.fire.01.orange.0',
            blade: 'jb2a.flames.01.orange',
            swing: 'jb2a.scimitar.melee.01.white',
            flames: 'jb2a.flames.01.orange',
            impact: 'jb2a.impact.007.orange'
        }
    }
};
async function play(sourceToken, targetToken, {color = 'orange', impact = true, hit} = {}) {
    if (hit === undefined) return;
    const files = getPalette(palettes, color);
    if (!files) return;
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file(files.swing)
            .atLocation(sourceToken)
            .stretchTo(targetToken)
            .missed(!hit)
            .zIndex(2)
            .waitUntilFinished(-600)
        .effect()
            .file(files.flames)
            .atLocation(targetToken)
            .scaleToObject(1.5)
            .zIndex(1)
            .playIf(hit)
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
async function create(effect, targetToken, {color = 'orange', cast = true} = {}) {
    const files = getPalette(palettes, color);
    if (!files) return;
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file(files.cast)
            .attachTo(targetToken)
            .scaleToObject(1.5)
            .playIf(cast)
            .waitUntilFinished(-750)
        .effect()
            .file(files.blade)
            .attachTo(targetToken)
            .scaleToObject(1)
            .fadeIn(250)
            .fadeOut(500)
            .duration(2000)
            .zIndex(2)
        .play();
    /* eslint-enable indent */
}
export const flameBlade = {
    name: 'CHRISPREMADES.Animations.FlameBlade',
    macros: {
        play,
        create
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            color: colorOption(colorMap, ['orange'], {auto: false, hint: 'CHRISPREMADES.Animations.FlameBladeColorHint'}),
            cast: partOption('Cast'),
            impact: partOption('Impact')
        };
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
