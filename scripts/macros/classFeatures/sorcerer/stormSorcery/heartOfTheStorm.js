import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
async function attack({speaker, actor, token, character, item, args}) {
    if (this.targets.size === 0 || this.item.type != 'spell' || this.item.system.level === 0) return;
    let queueSetup = await queue.setup(this.item.uuid, 'heartOfTheStorm', 250);
    if (!queueSetup) return;
    let damageTypes = chris.getRollDamageTypes(this.damageRoll);
    if (!(damageTypes.has('lightning') || damageTypes.has('thunder'))) {
        queue.remove(this.item.uuid);
        return;
    }
    let effect = chris.findEffect(this.actor, 'Heart of the Storm');
    if (!effect) {
        queue.remove(this.item.uuid);
        return;
    }
    let originItem = await fromUuid(effect.origin);
    await originItem.use();
    queue.remove(this.item.uuid);
}
async function item({speaker, actor, token, character, item, args}) {
    if (this.targets.size === 0) return;
    let queueSetup = await queue.setup(this.item.uuid, 'heartOfTheStormItem', 50);
    if (!queueSetup) return;
    let selection = await chris.dialog('What damage type?', [['Lightning', 'lightning'], ['Thunder', 'thunder']]);
    if (!selection) selection = 'lightning';
    let damageFormula = this.damageRoll._formula;
    damageFormula += '[' + selection + ']';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await this.setDamageRoll(damageRoll);
    queue.remove(this.item.uuid);
}
export let heartOfTheStorm = {
    'attack': attack,
    'item': item
}