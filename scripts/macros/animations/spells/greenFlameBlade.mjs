import {animationUtils} from '../../../proxy.mjs';
const colorMap = {
    green: 'Green',
    orange: 'Orange',
    blue: 'Blue',
    purple: 'Purple'
};
function getColor(color) {
    return animationUtils.jb2aCheck() === 'patreon' ? color : 'orange';
}
async function attack(sourceToken, targetToken, {missed, color = 'green'} = {}) {
    if (missed) return;
    new Sequence()
        .effect()
        .file('jb2a.flames.01.' + getColor(color))
        .atLocation(targetToken)
        .scaleToObject(1.5)
        .play();
}
async function leap(sourceToken, targetToken, {color = 'green'} = {}) {
    await new Sequence()
        .effect()
        .file('jb2a.fire_bolt.' + getColor(color))
        .atLocation(sourceToken)
        .stretchTo(targetToken)
        .waitUntilFinished(-500)
        .effect()
        .file('jb2a.flames.01.' + getColor(color))
        .atLocation(targetToken)
        .scaleToObject(1.5)
        .play();
}
export const greenFlameBlade = {
    name: 'CHRISPREMADES.Animations.GreenFlameBlade',
    macros: {
        attack,
        leap
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            color: {
                default: 'green',
                type: 'select',
                label: 'CHRISPREMADES.Config.Color',
                hint: 'CHRISPREMADES.Animations.GreenFlameBladeColorHint',
                options: animationUtils.buildColorOptions(colorMap, {
                    freeColors: ['orange'],
                    labelPrefix: 'CHRISPREMADES.Config.Colors.',
                    requirements: ['jb2a_patreon']
                })
            }
        };
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
