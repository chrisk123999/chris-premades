import {crusadersMantle as crusadersMantleLegacy, crusadersMantleAura as crusadersMantleAuraLegacy} from '../../../legacyMacros.js';
export let crusadersMantle = {
    name: 'Crusader\'s Mantle',
    version: '1.2.21',
    rules: 'modern',
    midi: crusadersMantleLegacy.midi
};
export let crusadersMantleAura = {
    name: 'Crusader\'s Mantle: Aura',
    version: crusadersMantle.version,
    rules: crusadersMantle.rules,
    aura: crusadersMantleAuraLegacy.aura
};