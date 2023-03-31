import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
export async function piercer({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size === 0 || !this.damageRoll || !['mwak', 'rwak', 'msak', 'rsak'].includes(this.item.system.actionType)) return;
    let effect = chris.findEffect(this.actor, 'Piercer');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    let doExtraDamage = chris.perTurnCheck(originItem, 'feat', 'piercer', false, this.token.id);
    if (!doExtraDamage) return;
    let queueSetup = await queue.setup(this.item.uuid, 'piercer', 390);
    if (!queueSetup) return;
    let damageTypes = chris.getRollDamageTypes(this.damageRoll);
    if (!damageTypes.has('piercing')) {
        queue.remove(this.item.uuid);
        return;
    }
    let autoPiercer = this.actor.flags['chris-premades']?.feat?.piercer?.auto;
    
}