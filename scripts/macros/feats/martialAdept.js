import {itemUtils} from '../../utils.js';
import {superiorityHelper} from '../classFeatures/fighter/battleMaster/superiorityDice.js';

async function hit({workflow}) {
    let superiorityDice = itemUtils.getItemByIdentifier(workflow.actor, 'superiorityDice');
    if (superiorityDice) return;
    await superiorityHelper(workflow);
}
export let martialAdept = {
    name: 'Martial Adept',
    version: '1.0.7',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: hit,
                priority: 50
            }
        ]
    }
};