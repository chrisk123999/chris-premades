import {magicMissile as magicMissileLegacy} from '../../../legacyMacros.js';
export let magicMissile = {
    ...magicMissileLegacy,
    version: '1.2.28',
    rules: 'modern',
    config: [
        {
            value: 'rollEach',
            label: 'CHRISPREMADES.Macros.MagicMissile.RollEach',
            type: 'checkbox',
            default: true,
            category: 'homebrew',
            homebrew: true
        },
        ...magicMissileLegacy.config.slice(1)
    ]
};