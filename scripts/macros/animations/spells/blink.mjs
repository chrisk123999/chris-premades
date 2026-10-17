import {animationUtils} from '../../../proxy.mjs';
import {mistyStep} from '../generic/teleport.mjs';
export const blink = {
    name: 'CHRISPREMADES.Animations.Blink',
    macros: {
        banish: targetToken => mistyStep.macros.preAnimation(targetToken, {color: 'purple'}),
        return: targetToken => mistyStep.macros.postAnimation(targetToken, {color: 'purple'})
    },
    inputs: ['targetToken'],
    requirements: ['JB2A_DnD5e'],
    category: 'spell',
    get credits() { return [animationUtils.getCredits('tyler')]; }
};
