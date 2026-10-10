import {animationUtils} from '../../../proxy.mjs';
const colorMap = {
    blue: 'Blue',
    blue02: 'Blue02',
    dark_purple: 'DarkPurple',
    dark_red: 'DarkRed',
    green: 'Green',
    green02: 'Green02',
    orange: 'Orange',
    red: 'Red',
    purple: 'Purple',
    yellow: 'Yellow'
};
const dynamicColors = Object.keys(colorMap);
async function create(effect, sourceToken, {color = 'blue'} = {}) {
    if (animationUtils.jb2aCheck() !== 'patreon') color = 'blue';
    if (color === 'random') color = dynamicColors[Math.floor(Math.random() * dynamicColors.length)];
    new Sequence()
        .effect()
        .file('jb2a.static_electricity.01.' + color)
        .attachTo(sourceToken)
        .scaleToObject(1.5)
        .name('Booming Blade')
        .persist()
        .tieToDocuments(effect)
        .play();
}
export const boomingBlade = {
    name: 'CHRISPREMADES.Animations.BoomingBlade',
    macros: {
        create
    },
    inputs: ['document', 'sourceToken'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            color: {
                default: 'blue',
                type: 'select',
                label: 'CHRISPREMADES.Config.Color',
                hint: 'CHRISPREMADES.Animations.BoomingBladeColorHint',
                options: animationUtils.buildColorOptions(colorMap, {
                    freeColors: ['blue'],
                    labelPrefix: 'CHRISPREMADES.Config.Colors.',
                    random: true,
                    requirements: ['jb2a_patreon']
                })
            }
        };
    }
};
