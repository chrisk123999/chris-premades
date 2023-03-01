import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
async function attack(workflow) {
    if (workflow.targets.size === 0 || workflow.item.type != 'spell' || workflow.item.system.level === 0) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'heartOfTheStorm', 250);
    if (!queueSetup) return;
    let damageTypes = chris.getRollDamageTypes(workflow.damageRoll);
    if (!(damageTypes.has('lightning') || damageTypes.has('thunder'))) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let effect = chris.findEffect(workflow.actor, 'Heart of the Storm');
    if (!effect) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let originItem = await fromUuid(effect.origin);
    await originItem.use();
    queue.remove(workflow.item.uuid);
}
async function item(workflow) {
    if (workflow.targets.size === 0) return;
    let selection = await chris.dialog('What damage type?', [['Lightning', 'lightning'], ['Thunder', 'thunder']]);
    if (!selection) selection = 'lightning';
    let damageFormula = workflow.damageRoll._formula;
    damageFormula += '[' + selection + ']';
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
}
export let heartOfTheStorm = {
    'attack': attack,
    'item': item
}