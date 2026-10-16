import {animationUtils} from '../../../proxy.mjs';
import {addCast, auraSize, casts, endPersist, getPalette, partOption, persistName, pickFile} from '../generic/spellParts.mjs';
// Raises the shimmering barrier around the caster for the duration.
async function create(effect, token, {circle = true} = {}) {
    const sequence = new Sequence();
    addCast(sequence, token, undefined, {file: getPalette(casts, 'blue'), wait: -750});
    /* eslint-disable indent */
    await sequence
        .effect()
            .name(persistName('antilifeShell', effect))
            .file(pickFile(circle ? 'jb2a.antilife_shell.blue_with_circle' : 'jb2a.antilife_shell.blue_no_circle', 'jb2a.template_circle.aura.01.loop.large.bluepurple'))
            .attachTo(token)
            .size(auraSize(token, 10), {gridUnits: true})
            .scaleIn(0, 750, {ease: 'easeOutBack'})
            .fadeOut(1000)
            .opacity(0.8)
            .persist()
            .tieToDocuments(effect)
        .play();
    /* eslint-enable indent */
}
export const antilifeShell = {
    name: 'CHRISPREMADES.Animations.AntilifeShell',
    macros: {
        create,
        delete: endPersist('antilifeShell')
    },
    inputs: ['targetToken'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {circle: partOption('Circle', {hint: 'CHRISPREMADES.Animations.AntilifeShellCircleHint'})};
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
