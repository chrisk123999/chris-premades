import {itemUtils} from '../../../utils.js';
async function skill(actor, skillId) {
    if (skillId !== 'sur') return;
    let item = itemUtils.getItemByIdentifier(actor, 'labyrinthineRecall');
    if (item) return {label: 'CHRISPREMADES.Macros.LabyrinthineRecall.Skill', type: 'advantage'};
}
export let labyrinthineRecall = {
    name: 'Labyrinthine Recall',
    version: '0.12.64',
    skill: [
        {
            pass: 'context',
            macro: skill,
            priority: 50
        }
    ]
};