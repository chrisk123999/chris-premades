import {effectUtils} from '../../utils.js';
async function save(actor, saveId, options) {
    let effect = effectUtils.getEffectByIdentifier(actor, 'protectionFromEvilAndGood');
    if (effect) return {label: 'CHRISPREMADES.Macros.ProtectionFromEvilAndGood.Save', type: 'advantage'};
}
export let protectionFromEvilAndGood = {
    name: 'Protection from Evil and Good',
    version: '0.12.0',
    save: [
        {
            macro: save
        }
    ]
};