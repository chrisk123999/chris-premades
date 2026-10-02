import {constants} from '../../../../../proxy.mjs';
export const lunarForm = {
    name: 'Lunar Form',
    version: '2.0.0',
    rules: '2024',
    config: {
        formula: {
            default: '2d10',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'homebrew'
        },
        damageType: {
            default: 'radiant',
            type: 'select',
            get options() {
                return constants.damageTypeOptions;
            },
            label: 'CHRISPREMADES.Config.DamageType',
            category: 'homebrew'
        }
    }
};
