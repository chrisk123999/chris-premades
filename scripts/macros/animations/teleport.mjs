import {animationUtils} from '../../proxy.mjs';
const colorMap = {
    blue: 'Blue',
    dark_black: 'Black',
    dark_green: 'DarkGreen',
    dark_purple: 'DarkPurple',
    dark_red: 'DarkRed',
    green: 'Green',
    grey: 'Grey',
    orange: 'Orange',
    pink: 'Pink',
    purple: 'Purple',
    red: 'Red',
    yellow: 'Yellow'
};
async function mistyStepPre(token, {color = 'blue'} = {}) {
    if (color !== 'blue' && !game.modules.get('jb2a_patreon')?.active) color = 'blue';
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file('jb2a.misty_step.01.' + color)
            .atLocation(token)
            .scaleToObject(1.5)
            .belowTokens()
        .animation()
            .delay(300)
            .on(token)
            .opacity(0)
            .fadeIn(500)
            .waitUntilFinished()
        .play();
    /* eslint-enable indent */
}
async function mistyStepPost(token, {color = 'blue'} = {}) {
    if (color !== 'blue' && !game.modules.get('jb2a_patreon')?.active) color = 'blue';
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .delay(100)
            .file('jb2a.misty_step.02.' + color)
            .atLocation(token, {cacheLocation: false})
            .scaleToObject(1.5)
            .belowTokens()
        .animation()
            .delay(300)
            .on(token)
            .opacity(1)
            .fadeIn(500)
        .play();
    /* eslint-enable indent */
}
export const mistyStep = {
    name: 'CHRISPREMADES.Animations.MistyStep',
    macros: {
        preAnimation: mistyStepPre,
        postAnimation: mistyStepPost
    },
    inputs: ['token', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'feature',
    get config() {
        return {
            color: {
                default: 'blue',
                type: 'select',
                label: 'CHRISPREMADES.Config.Color',
                options: animationUtils.buildColorOptions(colorMap, {
                    freeColors: ['blue'],
                    labelPrefix: 'CHRISPREMADES.Config.Colors.',
                    requirements: ['jb2a_patreon']
                })
            }
        };
    }
};
