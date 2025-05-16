import {itemUtils} from '../../../../utils.js';

async function skill({trigger: {skillId}}) {
    if (skillId !== 'prc') return;
    if (!itemUtils.getEquipmentState(item)) return;
    return {label: 'CHRISPREMADES.Macros.DanothsVisor.Check', type: 'advantage'};
}
export let eyesOfTheEagle = {
    name: 'Eyes of the Eagle',
    version: '1.1.0',
    skill: [
        {
            pass: 'context',
            macro: skill,
            priority: 50
        }
    ]
};