import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
export async function orcishFury({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size === 0 || !this.damageRoll || this.item.type != 'weapon') {
        let effect = chris.findEffect(this.actor, 'Orcish Fury - Extra Damage');
        if (!effect) return;
        let originItem = await fromUuid(effect.origin);
        if (!originItem) return;
        await originItem.update({'system.uses.value': 1});
        return;
    } else {
        let weaponDice = this.damageRoll.terms[0].faces;
        if (!weaponDice) return;
        let diceNumber = 1;
        if (this.isCritical) diceNumber = 2;
        let queueSetup = await queue.setup(this.item.uuid, 'orcishFury', 250);
        if (!queueSetup) return;
        let damageFormula = this.damageRoll._formula + ' + ' + diceNumber + 'd' + weaponDice + '[' + this.damageRoll.terms[0].flavor + ']';
        let damageRoll = await new Roll(damageFormula).roll({async: true});
        await this.setDamageRoll(damageRoll);
        queue.remove(this.item.uuid);
    }
}