import {genericUtils} from '../../../../utils.js';
export let greaterDivineIntervention = {
    name: 'Greater Divine Intervention',
    version: '1.2.27',
    rules: 'modern',
    config: [
        {
            value: 'restFormula',
            label: 'CHRISPREMADES.Macros.GreaterDivineIntervention.RestFormula',
            type: 'text',
            default: '2d4',
            category: 'homebrew',
            homebrew: true
        }
    ]
};
async function rest({trigger: {entity: effect}}) {
    let restsLeft = effect.flags['chris-premades']?.greaterDivineInterventionRest?.value;
    if (!restsLeft || restsLeft === 1) {
        await genericUtils.remove(effect);
    } else {
        await genericUtils.setFlag(effect, 'chris-premades', 'greaterDivineInterventionRest.value', restsLeft - 1);
    }
}
export let greaterDivineInterventionRest = {
    name: 'Divine Intervention: Blocked',
    version: greaterDivineIntervention.version,
    rules: 'modern',
    rest: [
        {
            pass: 'long',
            macro: rest,
            priority: 50
        }
    ]
};