import {combatUtils, genericUtils} from '../../../../utils.js';
async function move({trigger: {entity: item, token}}) {
    if (!combatUtils.inCombat()) return;
    if (!combatUtils.isOwnTurn(token) || !item.system.uses.value) return;
    await genericUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
}
export let steadyAim = {
    name: 'Steady Aim',
    version: '1.3.36',
    rules: 'modern',
    movement: [
        {
            pass: 'moved',
            macro: move,
            priority: 50
        }
    ]
};