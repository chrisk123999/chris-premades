import {genericUtils, itemUtils} from '../../../../utils.js';

async function combatStart({trigger: {token}}) {
    if (!token.actor) return;
    let diceItem = itemUtils.getItemByIdentifier(token.actor, 'superiorityDice');
    if (!diceItem || diceItem.system.uses.value) return;
    await genericUtils.update(diceItem, {'system.uses.value': 1});
}
export let relentless = {
    name: 'Relentless',
    version: '0.12.43',
    combat: [
        {
            pass: 'combatStart',
            macro: combatStart,
            priority: 50
        }
    ]
};