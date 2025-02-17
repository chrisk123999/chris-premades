import {genericUtils, itemUtils} from '../../../../utils.js';
async function combatStart({trigger: {entity: item}}) {
    let feature = itemUtils.getItemByIdentifier(item.actor, 'bardicInspiration');
    if (!feature) return;
    if (feature.system.uses.value >= 2) return;
    await genericUtils.update(feature, {'system.uses.spent': feature.system.uses.max - 2});
    await item.displayCard();
}
export let superiorInspiration = {
    name: 'Superior Inspiration',
    version: '1.1.34',
    rules: 'modern',
    combat: [
        {
            pass: 'combatStart',
            macro: combatStart,
            priority: 250
        }
    ]
};