import { starryForm as starryFormLegacy, starryFormActive as starryFormActiveLegacy } from '../../../../../legacyMacros.js';
export let starryForm = {
    ...starryFormLegacy,
    name: 'Starry Form',
    version: '1.3.83',
    rules: 'modern'
};
export let starryFormActive = {
    ...starryFormActiveLegacy,
    name: 'Starry Form: Active',
    version: starryForm.version,
    rules: starryForm.rules
};