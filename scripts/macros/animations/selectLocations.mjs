import {animationUtils, crosshairUtils, genericUtils} from '../../proxy.mjs';
async function select(token, range, {dark = false, displayHint = true} = {}) {
    if (displayHint) genericUtils.notify('CHRISPREMADES.Animations.SelectLocations.Message');
    const positions = [];
    let i = 0;
    let cancelled = false;
    const fade = dark ? 'jb2a.particles.outward.blue.01.03' : 'jb2a.particles.outward.purple.01.03';
    const offset = {x: token.object.w / 2, y: token.object.h / 2};
    while (!cancelled) {
        positions[i] = await crosshairUtils.aimCrosshair({token, maxRange: range});
        if (positions[i].cancelled) {
            positions.push(positions[i]);
            i++;
            /* eslint-disable indent */
            new Sequence()
                .effect()
                    .name('Dash Crosshair')
                    .copySprite(token)
                    .atLocation(positions[i], {offset})
                    .fadeIn(100)
                    .persist()
                    .opacity(0.65)
                    .locally()
                    .loopProperty('alphaFilter', 'alpha', {from: 1, to: 0.75, duration: 1500, pingPong: true})
                    .filter('ColorMatrix', {saturate: -1, brightness: 0.5})
                    .scale(token.texture.scaleX)
                    .fadeIn(250)
                    .fadeOut(500)
                    .waitUntilFinished(-500)
                .effect()
                    .file(fade)
                    .atLocation(positions[i], {offset})
                    .scale(0.15 * token.texture.scaleX)
                    .duration(1000)
                    .fadeOut(500)
                    .scaleIn(0, 1000, {ease: 'easeOutCubic'})
                    .filter('ColorMatrix', {hue: 0})
                    .animateProperty('sprite', 'width', {from: 0, to: 0.5, duration: 500, gridUnits: true, ease:'easeOutBack'})
                    .animateProperty('sprite', 'height', {from: 0, to: 1.5, duration: 1000, gridUnits: true, ease:'easeOutBack'})
                    .animateProperty('sprite', 'position.y', {from: 0, to: -1, duration: 1000, gridUnits: true})
                    .zIndex(0.2)
                    .filter('ColorMatrix', {saturate: -1, brightness: 0})
                    .locally()
                .play();
            /* eslint-enable indent */
        } else { 
            cancelled = true;
        }
    }
    Sequencer.EffectManager.endEffects({name: 'Dash Crosshair'});
    return positions;
}
export const selectLocations = {
    name: 'CHRISPREMADES.Animations.SelectLocation.Name',
    macros: {
        select
    },
    requirements: ['animated-spell-effects-cartoon', 'jb2a_patreon'],
    inputs: ['token', 'range', 'options'],
    type: 'crosshair',
    config: {
        dark: {
            label: 'CHRISPREMADES.Config.Dark',
            type: 'checkbox',
            default: false
        },
        displayHint: {
            label: 'CHRISPREMADES.Animations.SelectLocation.DisplayHint',
            type: 'checkbox',
            default: true
        }
    },
    get credits() {
        return [animationUtils.getEskieCredits()];
    }
};