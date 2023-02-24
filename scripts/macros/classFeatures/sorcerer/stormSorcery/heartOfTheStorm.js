import {chris} from '../../../../helperFunctions.js';
async function attack(workflow) {
    if (workflow.targets.size === 0 || workflow.item.type != 'spell' || workflow.item.system.level === 0) return;
    let damageType = workflow.defaultDamageType;
    let validTypes = ['lightning', 'thunder'];
    if (!validTypes.includes(damageType)) return;
    let effect = chris.findEffect(workflow.actor, 'Heart of the Storm');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    await originItem.use();
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