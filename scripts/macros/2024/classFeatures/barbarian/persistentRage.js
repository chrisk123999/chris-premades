import {genericUtils, itemUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    let item = itemUtils.getItemByIdentifier(workflow.actor, 'rage');
    console.log(item);
    if (!item) return;
    await genericUtils.update(item, {'system.uses.spent': 0});
}
export let persistentRage = {
    name: 'Persistent Rage',
    version: '1.1.22',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};