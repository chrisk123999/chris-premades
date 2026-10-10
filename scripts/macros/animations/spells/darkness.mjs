import {regionUtils} from '../../../proxy.mjs';
async function darkness(region, {opacity = 0.5, scale = 1.25} = {}) {
    const area = regionUtils.getArea(region);
    const effect = new Sequence()
        .effect()
        .name('Darkness.' + region.id)
        .file('jb2a.darkness.black');
    if (region.flags.cat?.spreadAroundCorners) effect.atLocation({x: area.x, y: area.y});
    else effect.attachTo(region.attachment?.token?.object ?? region.object ?? region);
    await effect
        .mask(region)
        .size(area.radius * 2 * scale)
        .aboveLighting()
        .xray(true)
        .opacity(opacity)
        .persist(true)
        .play();
}
async function endDarkness(region) {
    Sequencer.EffectManager.endEffects({name: 'Darkness.' + region.id});
}
export const darknessSphere = {
    name: 'CHRISPREMADES.Animations.Darkness.Name',
    macros: {
        darkness,
        endDarkness
    },
    inputs: ['region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    config: {
        opacity: {
            label: 'CHRISPREMADES.Config.Opacity',
            hint: 'CHRISPREMADES.Animations.Darkness.OpacityHint',
            type: 'number',
            default: 0.5
        },
        scale: {
            label: 'CHRISPREMADES.Config.Scale',
            hint: 'CHRISPREMADES.Animations.Darkness.ScaleHint',
            type: 'number',
            default: 1.25
        }
    }
};
