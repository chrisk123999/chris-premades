import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../queue.js';
async function onUse({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size === 0 || !this.damageRoll) return;
    let itemType = this.item.type;
    if (!(itemType === 'weapon' || (itemType === 'spell' && this.castData.castLevel === 0))) return;
    let effect = chris.findEffect(this.actor, 'Blessed Strikes');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    if (chris.inCombat()) {
        let featureUsed = originItem.flags['chris-premades']?.feature?.blessedStrikes?.used;
        if (featureUsed) return;
    }
    let queueSetup = await queue.setup(this.item.uuid, 'blessedStrikes', 150);
	if (!queueSetup) return;
    let selection = await chris.dialog('Use Blessed Strikes?', [['Yes', true], ['No', false]]);
    if (!selection) {
        queue.remove(this.item.uuid);
        return;
    }
    let damageFormula = this.damageRoll._formula + ' + 1d8[radiant]';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    if (chris.inCombat()) await originItem.setFlag('chris-premades', 'feature.blessedStrikes.used', true);
    queue.remove(this.item.uuid);
}
async function turnStart(origin) {
    await origin.setFlag('chris-premades', 'feature.blessedStrikes.used', false);
}
export let blessedStrikes = {
    'onUse': onUse,
    'turnStart': turnStart
}