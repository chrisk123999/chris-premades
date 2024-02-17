import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
export async function surpriseAttack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (!chris.inCombat()) return;
    if (game.combat.round != 1) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'surpriseAttack', 102);
    if (!queueSetup) return;
    let selection = await chris.dialog('Is the target surpised?', [['Yes', true], ['No', false]]);
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let defaultDamageType = workflow.damageRolls[0].terms[0].flavor;
    let damageFormula = workflow.damageRoll._formula + ' + 2d6[' + defaultDamageType + ']';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}