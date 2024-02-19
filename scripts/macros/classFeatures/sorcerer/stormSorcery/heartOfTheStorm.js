import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../utility/queue.js';
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
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
    let originItem = await effect.parent;
    await originItem.use();
    queue.remove(workflow.item.uuid);
}
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.targets.size === 0) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'heartOfTheStormItem', 50);
    if (!queueSetup) return;
    let selection = await chris.dialog('What damage type?', [['Lightning', 'lightning'], ['Thunder', 'thunder']]);
    if (!selection) selection = 'lightning';
    let damageFormula = workflow.damageRoll._formula;
    damageFormula += '[' + selection + ']';
    let damageRoll = await chris.damageRoll(workflow, damageFormula, {}, true);
    await workflow.setDamageRolls([damageRoll]);
    queue.remove(workflow.item.uuid);
}
export let heartOfTheStorm = {
    'attack': attack,
    'item': item
}