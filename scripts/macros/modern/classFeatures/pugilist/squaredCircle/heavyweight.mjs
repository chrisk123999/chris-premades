import {automationUtils} from '../../../../../proxy.mjs';
function sizeCheck({document: item}) {
    return automationUtils.getConfigValue(item, 'sizeBonus');
}
export const heavyweight = {
    name: 'Heavyweight',
    version: '2.1.8',
    rules: '2024',
    grapple: [
        {
            pass: 'actorGrappleShoveSizeCheck',
            macro: sizeCheck,
            priority: 50
        }
    ],
    config: {
        sizeBonus: {
            default: 1,
            type: 'number',
            category: 'homebrew',
            label: 'CHRISPREMADES.Macros.Modern.Heavyweight.SizeBonus'
        }
    }
};
