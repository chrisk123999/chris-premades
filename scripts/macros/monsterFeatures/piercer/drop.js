import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {translate} from '../../../translations.js';
import {queue} from '../../../utility/queue.js';
export async function drop({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size != 1) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'drop', 50);
    if (!queueSetup) return;
    let distance = workflow.token.document.elevation - workflow.targets.first().document.elevation;
    let formula;
    let damageType;
    if (!workflow.hitTargets.size) {
        let diceNum = Math.min((Math.floor(distance / 10) * 10), 200) / 10;
        formula = diceNum + 'd6[' + translate.damageType('bludgeoning') + ']';
        damageType = 'bludgeoning';
    } else {
        let diceNum = Math.min((Math.floor(distance / 10) * 10), 60) / 10;
        formula = diceNum + 'd6[' + translate.damageType(workflow.defaultDamageType) + ']';
        damageType = workflow.defaultDamageType;
    }
    let damageRoll = await chris.damageRoll(workflow, formula, {'type': damageType});
    await workflow.setDamageRolls([damageRoll]);
    let updates = {
        'elevation': workflow.targets.first().document.elevation
    };
    await workflow.token.document.update(updates);
    if (!workflow.hitTargets.size) await chris.applyDamage([workflow.token], Math.floor(damageRoll.total / 2), 'bludgeoning');
    queue.remove(workflow.item.uuid);
}