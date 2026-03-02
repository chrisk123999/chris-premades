import {setDamageRoll as legacySetDamageRolls} from '../../../legacyMacros.js';
export let setDamageRolls = {
    ...legacySetDamageRolls,
    rules: 'modern'
};