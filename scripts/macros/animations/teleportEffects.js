async function defaultPre(token) {
    await new Sequence()
        .effect()
        .file('jb2a.cast_generic.02.blue.0')
        .atLocation(token)
        .scaleToObject(2)
        .belowTokens()
        .playbackRate(0.9)
        .waitUntilFinished(-200)
        .play();
}
async function defaultPost(token) {
    await new Sequence()
        .effect()
        .delay(100)
        .file('jb2a.impact.011.blue')
        .atLocation(token, {cacheLocation: false})
        .scaleToObject(2)
        .waitUntilFinished()
        .play();
}
async function mistyStepPre(token) {
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
}
async function mistyStepPost(token) {
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
}
export let teleportEffects = {
    default: {
        pre: defaultPre,
        post: defaultPost
    },
    mistyStep: {
        pre: mistyStepPre,
        post: mistyStepPost
    }
};