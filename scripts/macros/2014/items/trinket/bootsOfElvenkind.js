import {itemUtils} from '../../../../utils.js';

async function skill({trigger: {entity: item, skillId}}) {
    if (skillId !== 'ste') return;
    if (!itemUtils.getEquipmentState(item)) return;
    return {label: 'CHRISPREMADES.Macros.BootsOfElvenkind.Silent', type: 'advantage'};
}
export let bootsOfElvenkind = {
    name: 'Boots of Elvenkind',
    version: '1.1.0',
    skill: [
        {
            pass: 'context',
            macro: skill,
            priority: 50
        }
    ]
};