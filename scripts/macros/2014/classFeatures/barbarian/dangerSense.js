import {effectUtils} from '../../../../utils.js';
async function save({trigger}) {
    if (trigger.saveId !== 'dex') return;
    let blinded = effectUtils.getEffectByStatusID(trigger.actor, 'blinded');
    let deafened = effectUtils.getEffectByStatusID(trigger.actor, 'deafened');
    let incapacitated = effectUtils.getEffectByStatusID(trigger.actor, 'incapacitated');
    if (blinded || deafened || incapacitated) return;
    return {label: 'CHRISPREMADES.Macros.DangerSense.CanSee', type: 'advantage'};
}
export let dangerSense = {
    name: 'Danger Sense',
    version: '1.1.0',
    save: [
        {
            pass: 'context',
            macro: save,
            priority: 50
        }
    ]
};