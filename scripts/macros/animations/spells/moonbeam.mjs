import {regionUtils} from '../../../proxy.mjs';
import {addCast, casts, getPalette, partOption} from '../generic/spellParts.mjs';
function getName(region) {
    return 'moonbeam ' + region.uuid;
}
function addBeam(sequence, region, {opacity, scale, fadeIn}) {
    const area = regionUtils.getArea(region);
    /* eslint-disable indent */
    sequence
        .effect()
            .name(getName(region))
            .file('jb2a.moonbeam.01.loop.blue')
            .atLocation({x: area.x, y: area.y})
            .size(area.radius * 2 * scale)
            .opacity(opacity)
            .fadeIn(fadeIn)
            .fadeOut(1000)
            .persist()
            .tieToDocuments(region);
    /* eslint-enable indent */
}
async function play(sourceToken, region, {cast = true, impact = true, opacity = 0.8, scale = 1.5} = {}) {
    if (!region) return;
    const area = regionUtils.getArea(region);
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, area, {file: getPalette(casts, 'blue'), wait: -750});
    /* eslint-disable indent */
    sequence
        .effect()
            .file('jb2a.moonbeam.01.complete.blue')
            .atLocation({x: area.x, y: area.y})
            .size(area.radius * 2 * scale)
            .playIf(impact);
    /* eslint-enable indent */
    addBeam(sequence, region, {opacity, scale, fadeIn: 1500});
    await sequence.play();
}
async function move(region, {opacity = 0.8, scale = 1.5} = {}) {
    await Sequencer.EffectManager.endEffects({name: getName(region)});
    const sequence = new Sequence();
    addBeam(sequence, region, {opacity, scale, fadeIn: 500});
    await sequence.play();
}
async function pulse(targetToken, {impact = true} = {}) {
    if (!impact) return;
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file('jb2a.moonbeam.01.complete.blue')
            .atLocation(targetToken)
            .scaleToObject(1.5)
            .opacity(0.8)
        .play();
    /* eslint-enable indent */
}
export const moonbeam = {
    name: 'CHRISPREMADES.Animations.Moonbeam.Name',
    macros: {
        play,
        move,
        pulse
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    config: {
        cast: partOption('Cast'),
        impact: partOption('Impact', {hint: 'CHRISPREMADES.Animations.Moonbeam.ImpactHint'}),
        opacity: {
            label: 'CHRISPREMADES.Config.Opacity',
            hint: 'CHRISPREMADES.Animations.Moonbeam.OpacityHint',
            type: 'number',
            default: 0.8
        },
        scale: {
            label: 'CHRISPREMADES.Config.Scale',
            hint: 'CHRISPREMADES.Animations.Moonbeam.ScaleHint',
            type: 'number',
            default: 1.5
        }
    }
};
