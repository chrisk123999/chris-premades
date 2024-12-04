import {genericUtils, itemUtils} from '../../../../utils.js';

async function combatStart({trigger: {token}}) {
    if (!token.actor) return;
    let diceItem = itemUtils.getItemByIdentifier(token.actor, 'superiorityDice');
    if (!diceItem || diceItem.system.uses.value) return;
    await genericUtils.update(diceItem, {'system.uses.spent': diceItem.system.uses.spent - 1});
}
export let relentless = {
    name: 'Relentless',
    version: '1.1.0',
    combat: [
        {
            pass: 'combatStart',
            macro: combatStart,
            priority: 50
        }
    ]
};