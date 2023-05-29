import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../queue.js';
export async function breathWeapon({speaker, actor, token, character, item, args, scope, workflow}) {
    let dragonType = workflow.actor.flags['chris-premades']?.draconicSpirit?.type;
    if (!dragonType) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'breathWeapon', 50);
    if (!queueSetup) return;
    let options;
    switch (dragonType) {
        case 'Chromatic':
        case 'Metallic':
            options = [['Acid', 'acid'], ['Cold', 'cold'], ['Fire', 'fire'], ['Lightning', 'lightning'], ['Poison', 'poison']];
            break;
        case 'Gem':
            options = [['Force', 'force'], ['Necrotic', 'necrotic'], ['Psychic', 'psychic'], ['Radiant', 'radiant'], ['Thunder', 'thunder']];
            break;
    }
    let selection = await chris.dialog('What damage type?', options);
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let damageFormula = workflow.damageRoll._formula + '[' + selection + ']';
    let diceRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(diceRoll);
    queue.remove(workflow.item.uuid);
}