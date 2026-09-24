import {constants} from '../../../../../proxy.mjs';
export const stalkersFlurry = {
    name: 'Stalker\'s Flurry',
    version: '2.0.0',
    rules: '2024',
    config: {
        formula: {
            default: '2d8',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'homebrew'
        },
        damageType: {
            default: 'psychic',
            type: 'select',
            get options() {
                return constants.damageTypeOptions();
            },
            label: 'CHRISPREMADES.Config.DamageType',
            category: 'homebrew'
        },
        suddenStrikeRange: {
            default: 5,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Modern.StalkersFlurry.SuddenStrikeRange',
            category: 'homebrew'
        },
        range: {
            default: 10,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'homebrew'
        },
        includeSelf: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Modern.StalkersFlurry.IncludeSelf',
            category: 'homebrew'
        }
    }
};
