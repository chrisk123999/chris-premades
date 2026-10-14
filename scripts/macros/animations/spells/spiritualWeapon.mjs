import {animationUtils} from '../../../proxy.mjs';
import {addImpact, addShake, colorOption, getColor, partOption} from '../generic/spellParts.mjs';
const colorMap = {
    blue: 'Blue',
    green: 'Green',
    grey: 'Grey',
    orange: 'Orange',
    pink: 'Pink',
    purple: 'Purple',
    red: 'Red',
    yellow: 'Yellow'
};
async function play(sourceToken, targetToken, {color = 'auto', shake = true, damageType, hit} = {}) {
    if (!animationUtils.jb2aCheck()) return;
    color = getColor(color, damageType ?? 'force');
    const landed = hit !== false;
    const sequence = new Sequence();
    /* eslint-disable indent */
    sequence
        .animation()
            .on(sourceToken)
            .opacity(0)
        .effect()
            .copySprite(sourceToken)
            .atLocation(sourceToken)
            .scaleToObject(1, {considerTokenScale: true})
            .moveTowards(targetToken, {ease: 'easeInBack', rotate: false})
            .duration(450)
            .zIndex(2)
            .waitUntilFinished(-50);
    addImpact(sequence, targetToken, color, {scale: 1.25, playIf: landed});
    addShake(sequence, targetToken, {playIf: shake && landed});
    sequence
        .effect()
            .copySprite(sourceToken)
            .atLocation(targetToken)
            .scaleToObject(1, {considerTokenScale: true})
            .moveTowards(sourceToken, {ease: 'easeOutCubic', rotate: false})
            .duration(400)
            .zIndex(2)
            .waitUntilFinished(-50)
        .animation()
            .on(sourceToken)
            .opacity(1);
    /* eslint-enable indent */
    await sequence.play();
}
export const spiritualWeapon = {
    name: 'CHRISPREMADES.Animations.SpiritualWeapon',
    macros: {
        play
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            color: colorOption(colorMap, ['blue', 'orange', 'yellow']),
            shake: partOption('Shake')
        };
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
