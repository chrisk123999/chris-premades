import {effectUtils} from '../../utils.js';
async function save(actor, saveId, options) {
    let effect = effectUtils.getEffectByIdentifier(actor, 'protectionFromEvilAndGood');
    if (effect) return {label: 'CHRISPREMADES.macros.protectionFromEvilAndGood.save', type: 'advantage'};
}
export let protectionFromEvilAndGood = {
    name: 'Protection From Evil and Good',
    version: '0.12.0',
    save: [
        {
            macro: save
        }
    ]
};