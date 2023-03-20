import {chris} from '../../../helperFunctions.js';
export async function stillnessOfMind({speaker, actor, token, character, item, args}) {
    let charmedEffect = chris.findEffect(this.actor, 'Charmed');
    let frightenedEffect = chris.findEffect(this.actor, 'Frightened');
    if (!charmedEffect && !frightenedEffect) return;
    if (charmedEffect && frightenedEffect) {
        let selection = await chris.dialog('What condition would you like to remove?', [['Charmed', 1], ['Frightened', 2]]);
        if (!selection) return;
        if (selection === 1) await chris.removeCondition(this.actor, 'Charmed');
        if (selection === 2) await chris.removeCondition(this.actor, 'Frightened');
        return;
    }
    if (charmedEffect) await chris.removeCondition(this.actor, 'Charmed');
    if (frightenedEffect) await chris.removeCondition(this.actor, 'Frightened');
}