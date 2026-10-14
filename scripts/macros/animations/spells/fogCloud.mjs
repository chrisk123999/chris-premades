import {regionUtils} from '../../../proxy.mjs';
import {addCast, casts, getPalette, partOption} from '../generic/spellParts.mjs';
async function play(sourceToken, region, {cast = true, opacity = 0.5, scale = 1} = {}) {
    if (!region) return;
    const area = regionUtils.getArea(region);
    const sequence = new Sequence();
    if (cast && sourceToken) addCast(sequence, sourceToken, area, {file: getPalette(casts, 'grey'), wait: -750});
    const effect = sequence.effect()
        .name('fogCloud ' + region.uuid)
        .file('jb2a.fog_cloud.01.white');
    if (region.flags.cat?.spreadAroundCorners) effect.atLocation({x: area.x, y: area.y});
    else effect.attachTo(region.object ?? region);
    /* eslint-disable indent */
    effect
        .mask(region)
        .size(area.radius * 2 * scale)
        .aboveLighting()
        .xray(true)
        .opacity(opacity)
        .fadeIn(1500)
        .fadeOut(1500)
        .persist()
        .tieToDocuments(region);
    /* eslint-enable indent */
    await sequence.play();
}
export const fogCloud = {
    name: 'CHRISPREMADES.Animations.FogCloud.Name',
    macros: {
        play
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    config: {
        cast: partOption('Cast'),
        opacity: {
            label: 'CHRISPREMADES.Config.Opacity',
            hint: 'CHRISPREMADES.Animations.FogCloud.OpacityHint',
            type: 'number',
            default: 0.5
        },
        scale: {
            label: 'CHRISPREMADES.Config.Scale',
            hint: 'CHRISPREMADES.Animations.FogCloud.ScaleHint',
            type: 'number',
            default: 1
        }
    }
};
