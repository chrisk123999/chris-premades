import {animationUtils} from '../../../proxy.mjs';
import {colorOption, endPersist, persistName, pickFile} from '../generic/spellParts.mjs';
const colorMap = {
    green: 'Green',
    blue: 'Blue',
    purple: 'Purple',
    red: 'Red'
};
// Brands the quarry with a pulse, then keeps the hunter's sigil on it while it is marked.
async function create(effect, targetToken, {color = 'green'} = {}) {
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file(pickFile('jb2a.hunters_mark.pulse.01.' + color, 'jb2a.hunters_mark.pulse.01.green'))
            .attachTo(targetToken)
            .scaleToObject(1.5)
        .effect()
            .name(persistName('huntersMark', effect))
            .file(pickFile('jb2a.hunters_mark.loop.01.' + color, 'jb2a.hunters_mark.loop.01.green'))
            .attachTo(targetToken)
            .scaleToObject(1.2)
            .delay(500)
            .fadeIn(500)
            .fadeOut(500)
            .opacity(0.8)
            .persist()
            .tieToDocuments(effect)
        .play();
    /* eslint-enable indent */
}
export const huntersMark = {
    name: 'CHRISPREMADES.Animations.HuntersMark',
    macros: {
        create,
        delete: endPersist('huntersMark')
    },
    inputs: ['targetToken'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {color: colorOption(colorMap, ['green'], {auto: false})};
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
