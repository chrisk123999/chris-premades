import {ringOfSpellStoring as  ringOfSpellStoringLegacy, ringOfSpellStoringSpell as ringOfSpellStoringSpellLegacy} from '../../../../legacyMacros.js';
export let ringOfSpellStoring = {
    name: 'Ring of Spell Storing (0/5)',
    version: '1.3.124',
    rules: 'modern',
    ...ringOfSpellStoringLegacy
};
export let  ringOfSpellStoringSpell = {
    version: ringOfSpellStoring.version,
    rules: 'modern',
    ...ringOfSpellStoringSpellLegacy
};