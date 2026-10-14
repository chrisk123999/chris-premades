import {addCast, getPalette, partOption, persistName} from '../generic/spellParts.mjs';
const palettes = {
    patreon: {
        blue: {
            cast: 'jb2a.cast_generic.01.blue.0',
            tether: 'jb2a.energy_strands.range.standard.blue.01',
            ward: 'jb2a.shield.01.intro.blue',
            marker: 'jb2a.markers.light.loop.blue'
        }
    },
    free: {
        blue: {
            cast: 'jb2a.cast_generic.02.blue.0',
            tether: 'jb2a.energy_strands.range.standard.purple.01',
            ward: 'jb2a.shield.01.intro.blue',
            marker: 'jb2a.markers.light.loop.blue'
        }
    }
};
async function create(effect, targetToken, {cast = true, tether = true} = {}, {sourceToken} = {}) {
    const files = getPalette(palettes, 'blue');
    if (!files) return;
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, targetToken, {file: files.cast, wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .file(files.ward)
            .attachTo(targetToken)
            .scaleToObject(1.6)
            .zIndex(1)
        .effect()
            .name(persistName('wardingBond', effect))
            .file(files.marker)
            .attachTo(targetToken)
            .scaleToObject(1.6)
            .opacity(0.6)
            .fadeIn(1000)
            .fadeOut(500)
            .belowTokens()
            .persist()
            .tieToDocuments(effect);
    if (tether && sourceToken && sourceToken.parent === targetToken.parent) {
        sequence
            .effect()
                .name(persistName('wardingBond', effect))
                .file(files.tether)
                .attachTo(sourceToken)
                .stretchTo(targetToken, {attachTo: true})
                .scaleIn(0, 750, {ease: 'easeOutQuint'})
                .opacity(0.35)
                .fadeIn(750)
                .fadeOut(500)
                .belowTokens()
                .persist()
                .tieToDocuments(effect);
    }
    /* eslint-enable indent */
    await sequence.play();
}
export const wardingBond = {
    name: 'CHRISPREMADES.Animations.WardingBond',
    macros: {
        create
    },
    inputs: ['sourceToken', 'targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            cast: partOption('Cast'),
            tether: partOption('Tether', {hint: 'CHRISPREMADES.Animations.WardingBondTetherHint'})
        };
    }
};
