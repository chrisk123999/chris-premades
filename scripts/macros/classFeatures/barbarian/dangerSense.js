import {effectUtils} from '../../../utils.js';

async function save(actor, saveId) {
    if (saveId !== 'dex') return;
    let blinded = effectUtils.getEffectByStatusID(actor, 'blinded');
    let deafened = effectUtils.getEffectByStatusID(actor, 'deafened');
    let incapacitated = effectUtils.getEffectByStatusID(actor, 'incapacitated');
    if (blinded || deafened || incapacitated) return;
    return {label: 'CHRISPREMADES.Macros.DangerSense.CanSee', type: 'advantage'};
}

export let dangerSense = {
    name: 'Danger Sense',
    version: '0.12.15',
    save: [
        {
            macro: save
        }
    ]
};