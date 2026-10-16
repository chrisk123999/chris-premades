import {animationUtils} from '../../../proxy.mjs';
import {pickFile} from '../generic/spellParts.mjs';
import {prePlace, preRemove} from '../generic/summons.mjs';
// The arcane hand forms in a burst of force, then the token takes its place.
async function postPlace(summon, location, token) {
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file(pickFile('jb2a.magic_signs.circle.02.evocation.complete.blue', 'jb2a.magic_signs.circle.02.evocation.complete.dark_blue'))
            .atLocation(token)
            .scaleToObject(1.5)
            .belowTokens()
            .fadeOut(1000)
        .effect()
            .file('jb2a.arcane_hand.blue')
            .atLocation(token)
            .scaleToObject(1.4)
            .scaleIn(0, 600, {ease: 'easeOutBack'})
            .fadeOut(600)
            .duration(1800)
            .waitUntilFinished(-500)
        .animation()
            .on(token)
            .opacity(1)
            .fadeIn(500)
        .play();
    /* eslint-enable indent */
}
export const bigbysHandSummon = {
    name: 'CHRISPREMADES.Animations.BigbysHandSummon',
    macros: {
        prePlace,
        postPlace,
        preRemove
    },
    inputs: ['summon', 'location', 'token'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
