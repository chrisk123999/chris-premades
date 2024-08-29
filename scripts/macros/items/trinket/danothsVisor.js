import {itemUtils} from '../../../utils.js';
async function skill(actor, skillId) {
    let item = itemUtils.getItemByIdentifier('danothsVisorD') || itemUtils.getItemByIdentifier('danothsVisorA') || itemUtils.getItemByIdentifier('danothsVisorE');
    if (!item) return;
    let validTypes = [
        'inv',
        'per'
    ];
    if (!validTypes.includes(skillId)) return;
    return {label: 'CHRISPREMADES.Macros.Item.DanothsVisor.Check', type: 'advantage'};
}
export let danothsVisorD = {
    name: 'Danoth\'s Visor (Dormant)',
    version: '0.12.41',
    skill: [
        {
            macro: skill
        }
    ]
};
export let danothsVisorA = {
    name: 'Danoth\'s Visor (Awakened)',
    version: '0.12.41',
    skill: [
        {
            macro: skill
        }
    ]
};
export let danothsVisorE = {
    name: 'Danoth\'s Visor (Exalted)',
    version: '0.12.41',
    skill: [
        {
            macro: skill
        }
    ]
};