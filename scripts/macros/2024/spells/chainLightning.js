import {chainLightning as chainLightningLegacy} from '../../2014/spells/chainLightning.js';
export let chainLightning = {
    name: 'Chain Lightning',
    version: '1.1.19',
    rules: 'modern',
    midi: chainLightningLegacy.midi,
    config: chainLightningLegacy.config,
    hasAnimation: true
};