async function mistyStepPre(token) {
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file('jb2a.misty_step.01.blue')
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
async function mistyStepPost(token) {
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .delay(100)
            .file('jb2a.misty_step.02.blue')
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
    category: 'feature'
};
