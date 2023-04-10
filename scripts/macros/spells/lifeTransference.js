import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
export async function lifeTransference({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let damageFormula = (this.castData.castLevel + 1) + 'd8[none]';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: this.item.name
    });
    await chris.applyDamage(this.token, damageRoll.total, 'none');
    let queueSetup = await queue.setup(this.item.uuid, 'lifeTransference', 50);
    if (!queueSetup) return;
    let healing = damageRoll.total * 2;
    let healingRoll = await new Roll(healing + '[healing]').roll({async: true});
    await this.setDamageRoll(healingRoll);
    queue.remove(this.item.uuid);
}