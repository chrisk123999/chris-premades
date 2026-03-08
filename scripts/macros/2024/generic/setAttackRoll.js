import {setAttackRoll as legacySetAttackRoll} from '../../../legacyMacros.js';
export let setAttackRoll = {
    ...legacySetAttackRoll,
    rules: 'modern'
};