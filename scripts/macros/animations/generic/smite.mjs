import {animationUtils} from '../../../proxy.mjs';
import {pickFile} from './spellParts.mjs';
const colorMap = {
    orange: 'Orange',
    blueyellow: 'Blue',
    dark_purple: 'DarkPurple',
    dark_red: 'DarkRed',
    greenorange: 'Green',
    purplepink: 'Purple',
    red: 'Red',
    yellowhite: 'Yellow'
};
function play(targetToken, {color = 'blueyellow'} = {}) {
    const path = pickFile('jb2a.divine_smite.target.' + color, 'jb2a.divine_smite.target.blueyellow');
    /* eslint-disable indent */
    new Sequence()
        .effect()
            .file(path)
            .atLocation(targetToken)
        .play();
    /* eslint-enable indent */
} 
export const smite = {
    name: 'CHRISPREMADES.Animations.Smite',
    macros: {
        play
    },
    inputs: ['targetToken'],
    category: 'generic',
    get config() {
        return {
            color: {
                default: 'blueyellow',
                type: 'select',
                label: 'CHRISPREMADES.Config.Color',
                hint: 'CHRISPREMADES.Animations.SmiteColorHint',
                options: animationUtils.buildColorOptions(colorMap, {
                    freeColors: ['blueyellow'],
                    requirements: ['jb2a_patreon'],
                    labelPrefix: 'CHRISPREMADES.Config.Colors.'
                })
            }
        };
    }
};
