import {animationUtils} from '../../../proxy.mjs';
import {partOption} from '../generic/spellParts.mjs';
import {moonbeam} from './moonbeam.mjs';
function getColor() {
    return animationUtils.jb2aCheck() === 'patreon' ? 'yellow' : 'blue';
}
export const conjureCelestial = {
    name: 'CHRISPREMADES.Animations.ConjureCelestial',
    macros: {
        play: (sourceToken, region, options) => moonbeam.macros.play(sourceToken, region, {color: getColor(), ...options}),
        move: (region, options) => moonbeam.macros.move(region, {color: getColor(), ...options})
    },
    inputs: ['sourceToken', 'region', 'options'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    config: {
        cast: partOption('Cast'),
        impact: partOption('Impact'),
        opacity: {
            label: 'CHRISPREMADES.Config.Opacity',
            type: 'number',
            default: 0.8
        },
        scale: {
            label: 'CHRISPREMADES.Config.Scale',
            type: 'number',
            default: 1.5
        }
    }
};
