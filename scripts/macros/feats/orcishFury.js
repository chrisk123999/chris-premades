import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
export async function orcishFury({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size === 0 || !workflow.damageRoll || workflow.item.type != 'weapon') {
        let effect = chris.findEffect(workflow.actor, 'Orcish Fury - Extra Damage');
        if (!effect) return;
        let originItem = await fromUuid(effect.origin);
        if (!originItem) return;
        await originItem.update({'system.uses.value': 1});
        return;
    } else {
        let weaponDice = workflow.damageRolls[0].terms[0].faces;
        if (!weaponDice) return;
        let queueSetup = await queue.setup(workflow.item.uuid, 'orcishFury', 250);
        if (!queueSetup) return;
        let damageFormula = '1d' + weaponDice + '[' + workflow.defaultDamageType + ']';
        await chris.addToDamageRoll(workflow, damageFormula);
        queue.remove(workflow.item.uuid);
    }
}