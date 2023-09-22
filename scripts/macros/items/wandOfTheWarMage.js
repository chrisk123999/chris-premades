import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function wandOfTheWarMage({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!workflow.targets.size) return;
    let validTypes = ['rsak', 'msak'];
    if (!validTypes.includes(workflow.item.system.actionType)) return;
    if (game.settings.get('midi-qol', 'ConfigSettings').optionalRules.coverCalculation === 'none') return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'wandOfTheWarMage', 150);
    if (!queueSetup) return;
    let coverBonus = MidiQOL.computeCoverBonus(workflow.token, workflow.targets.first(), workflow.item);
    if (coverBonus != 2) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let updatedRoll = await chris.addToRoll(workflow.attackRoll, 2);
    workflow.setAttackRoll(updatedRoll);
    queue.remove(workflow.item.uuid);
}