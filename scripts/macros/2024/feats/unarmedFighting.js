import {fightingStyleUnarmedFighting as unarmedFightingLegacy, fightingStyleUnarmedFightingUnarmedStrike as unarmedFightingUnarmedStrikeLegacy} from '../../../legacyMacros.js';
export let unarmedFighting = {
    ...unarmedFightingLegacy,
    version: '1.2.36',
    rules: 'modern'
};
export let unarmedFightingUnarmedStrike = {
    ...unarmedFightingUnarmedStrikeLegacy,
    version: '1.2.36',
    rules: unarmedFighting.rules
}