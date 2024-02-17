import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
export async function prepare({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let baseItem = workflow.item.system.type?.baseItem;
    if (baseItem != 'greataxe') return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'prepare', 250);
    if (!queueSetup) return;
    let oldFormula = workflow.damageRoll._formula;
    let defaultDamageType = workflow.damageRolls[0].terms[0].flavor;
    let bonusDamageFormula = workflow.actor.system.abilities.str.mod + '[' + defaultDamageType + ']';
    if (workflow.isCritical) bonusDamageFormula = chris.getCriticalFormula(bonusDamageFormula);
    let damageFormula = oldFormula + ' + ' + bonusDamageFormula;
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
}