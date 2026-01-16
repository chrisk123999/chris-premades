import {itemUtils} from '../../../../../utils.js';
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['use'], 'sorceryPoints');
}
export let eyesOfTheDark = {
    name: 'Eyes of the Dark',
    version: '1.4.19',
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