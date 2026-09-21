async function darkness(region, {opacity = 0.5} = {}) {
    const target = region.object ?? region;
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .name('Darkness.' + region.id)
            .file('jb2a.darkness.black')
            .attachTo(target)
            .scaleToObject()
            .aboveLighting()
            .xray(true)
            .opacity(opacity)
            .persist(true)
        .play();
    /* eslint-enable indent */
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
            type: 'number',
            default: 0.5
        }
    }
};
