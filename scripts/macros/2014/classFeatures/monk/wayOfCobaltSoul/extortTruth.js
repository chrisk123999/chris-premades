import {genericUtils, itemUtils} from '../../../../../utils.js';
async function added({trigger: {entity: item}}) {
    let monkItem = itemUtils.getItemByIdentifier(item.actor, 'ki') ?? itemUtils.getItemByIdentifier(item.actor, 'monksFocus');
    if (!monkItem) return;
    let identifier = genericUtils.getIdentifier(monkItem);
    await itemUtils.correctActivityItemConsumption(item, ['save'], identifier);
}
export let extortTruth = {
    name: 'Extort Truth',
    version: '1.3.165',
    rules: 'legacy',
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 55
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 55
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 55
        }
    ]
};