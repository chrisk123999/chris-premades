import {animationUtils} from '../../../proxy.mjs';
import {endPersist, persistName} from '../generic/spellParts.mjs';
const variants = {
    warm: {theme: 'fire', color: 'orange', crack: 'jb2a.impact.ground_crack.orange.01', particles: 'jb2a.particles.outward.orange.01.03', strands: 'jb2a.energy_strands.in.yellow.01.2', border: 'jb2a.token_border.circle.spinning.orange.004'},
    chill: {theme: 'ice', color: 'blue', crack: 'jb2a.impact.ground_crack.blue.01', particles: 'jb2a.particles.outward.blue.01.03', strands: 'jb2a.energy_strands.in.blue.01.2', border: 'jb2a.token_border.circle.spinning.blue.004'}
};
async function create(effect, targetToken, {variant = 'warm'} = {}) {
    const files = variants[variant] ?? variants.warm;
    const isPatreon = animationUtils.jb2aCheck() === 'patreon';
    const shield = 'jb2a.shield_themed.{side}.' + files.theme + (isPatreon ? '.03.' : '.01.') + files.color;
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .file(files.crack)
            .atLocation(targetToken)
            .scaleToObject(3)
            .belowTokens()
            .playIf(isPatreon || variant === 'warm')
        .effect()
            .file(files.particles)
            .atLocation(targetToken)
            .delay(200)
            .scaleIn(0.5, 250)
            .fadeOut(1500)
            .duration(4000)
            .scaleToObject(2.75)
            .zIndex(2)
            .playIf(isPatreon)
        .effect()
            .file(files.strands)
            .atLocation(targetToken)
            .delay(200)
            .scaleIn(0.5, 250)
            .duration(2000)
            .scaleToObject(2.75)
            .belowTokens()
            .zIndex(1)
            .playIf(isPatreon)
        .effect()
            .name(persistName('fireShield', effect))
            .file(files.border)
            .attachTo(targetToken)
            .scaleToObject(2.2)
            .fadeOut(500)
            .persist()
            .tieToDocuments(effect)
            .playIf(isPatreon || variant === 'chill')
        .effect()
            .name(persistName('fireShield', effect))
            .file(shield.replace('{side}', 'below'))
            .attachTo(targetToken)
            .delay(1000)
            .scaleToObject(1.7)
            .fadeIn(500)
            .fadeOut(200)
            .belowTokens()
            .persist()
            .tieToDocuments(effect)
        .effect()
            .name(persistName('fireShield', effect))
            .file(shield.replace('{side}', 'above'))
            .attachTo(targetToken)
            .scaleToObject(1.7)
            .fadeIn(3500)
            .fadeOut(200)
            .persist()
            .tieToDocuments(effect)
        .play();
    /* eslint-enable indent */
}
export const fireShield = {
    name: 'CHRISPREMADES.Animations.FireShield',
    macros: {
        create,
        delete: endPersist('fireShield')
    },
    inputs: ['targetToken', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    config: {
        variant: {
            default: 'warm',
            type: 'select',
            label: 'CHRISPREMADES.Animations.FireShieldVariant',
            options: {
                warm: {label: 'CHRISPREMADES.Animations.FireShieldWarm'},
                chill: {label: 'CHRISPREMADES.Animations.FireShieldChill'}
            }
        }
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
