import {itemUtils} from '../../../../utils.js';
import {superiorityHelper} from '../fighter/battleMaster/superiorityDice.js';

async function hit({workflow}) {
    let superiorityDice = itemUtils.getItemByIdentifier(workflow.actor, 'superiorityDice');
    let martialAdept = itemUtils.getItemByIdentifier(workflow.actor, 'martialAdept');
    if (superiorityDice || martialAdept) return;
    await superiorityHelper(workflow);
}
export let fightingStyleSuperiorTechnique = {
    name: 'Fighting Style: Superior Technique',
    version: '1.1.0',
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