import {animationUtils, automationUtils, effectUtils} from '../../../proxy.mjs';
import {getCastDamageType} from '../../generic/selectDamageType.mjs';
import {auraSize, colorOption, endPersist, persistName, pickFile} from '../generic/spellParts.mjs';
const colorMap = {
    blueyellow: 'BlueYellow',
    blue: 'Blue',
    dark_black: 'Black',
    dark_blue: 'DarkBlue',
    dark_purple: 'DarkPurple',
    dark_red: 'DarkRed',
    dark_whiteblue: 'WhiteBlue',
    green: 'Green',
    greenorange: 'GreenOrange',
    orange: 'Orange',
    pinkpurple: 'PinkPurple'
};
const damageColors = {radiant: 'blueyellow', necrotic: 'dark_purple'};
// Guardian spirits circle the caster for the duration, colored by the damage type chosen at casting.
async function create(effect, token, {color = 'auto'} = {}) {
    if (color === 'auto') color = damageColors[getCastDamageType(effectUtils.getOriginActivitySync(effect)?.item)] ?? 'blueyellow';
    const size = auraSize(token, Number(automationUtils.getGenericConfigValue(effect, 'cat', 'aura', 'radius')) || 15);
    /* eslint-disable indent */
    await new Sequence()
        .effect()
            .name(persistName('spiritGuardians', effect))
            .file(pickFile('jb2a.spirit_guardians.' + color + '.ring', 'jb2a.spirit_guardians.blueyellow.ring', 'jb2a.template_circle.aura.01.loop.large.bluepurple'))
            .attachTo(token)
            .size(size, {gridUnits: true})
            .belowTokens()
            .fadeIn(1000)
            .fadeOut(1000)
            .persist()
            .tieToDocuments(effect)
        .effect()
            .name(persistName('spiritGuardians', effect))
            .file(pickFile('jb2a.spirit_guardians.' + color + '.spirits', 'jb2a.spirit_guardians.blueyellow.spirits'))
            .attachTo(token)
            .size(size, {gridUnits: true})
            .fadeIn(1000)
            .fadeOut(1000)
            .opacity(0.8)
            .persist()
            .tieToDocuments(effect)
        .play();
    /* eslint-enable indent */
}
export const spiritGuardians = {
    name: 'CHRISPREMADES.Animations.SpiritGuardians',
    macros: {
        create,
        delete: endPersist('spiritGuardians')
    },
    inputs: ['targetToken'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get config() {
        return {
            color: colorOption(colorMap, ['blueyellow'], {hint: 'CHRISPREMADES.Animations.SpiritGuardiansColorHint'})
        };
    },
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
