import {passWithoutTrace as passWithoutTraceLegacy} from '../../../legacyMacros.js';
export let passWithoutTrace = {
    ...passWithoutTraceLegacy,
    version: '1.2.22',
    rules: 'modern'
};