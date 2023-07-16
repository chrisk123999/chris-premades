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
        let weaponDice = workflow.damageRoll.terms[0].faces;
        if (!weaponDice) return;
        let diceNumber = 1;
        if (workflow.isCritical) diceNumber = 2;
        let queueSetup = await queue.setup(workflow.item.uuid, 'orcishFury', 250);
        if (!queueSetup) return;
        let damageFormula = workflow.damageRoll._formula + ' + ' + diceNumber + 'd' + weaponDice + '[' + workflow.damageRoll.terms[0].flavor + ']';
        let damageRoll = await new Roll(damageFormula).roll({async: true});
        await workflow.setDamageRoll(damageRoll);
        queue.remove(workflow.item.uuid);
    }
}