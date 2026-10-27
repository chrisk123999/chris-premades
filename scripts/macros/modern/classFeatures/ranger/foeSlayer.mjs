import {constants} from '../../../../proxy.mjs';
export const foeSlayer = {
    name: 'Foe Slayer',
    version: '2.1.4',
    rules: '2024',
    config: {
        formula: {
            default: '1d10',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'homebrew'
        },
        damageType: {
            default: 'force',
            type: 'select',
            get options() {
                return constants.damageTypeOptions;
            },
            label: 'CHRISPREMADES.Config.DamageType',
            category: 'homebrew'
        }
    }
};
