import {itemUtils} from '../../../../utils.js';

async function skill({trigger: {entity: item, skillId}}) {
    if (skillId !== 'inv') return;
    if (!itemUtils.getEquipmentState(item)) return;
    return {label: 'CHRISPREMADES.Macros.EyesOfMinuteSeeing.Close', type: 'advantage'};
}
export let eyesOfMinuteSeeing = {
    name: 'Eyes of Minute Seeing',
    version: '1.1.0',
    skill: [
        {
            pass: 'context',
            macro: skill,
            priority: 50
        }
    ]
};