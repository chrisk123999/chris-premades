import {itemUtils} from '../../../../utils.js';
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['use'], 'balefulInterdict');
}
export let superiorInterdict = {
    name: 'Superior Interdict',
    version: '1.3.70',
    rules: 'legacy',
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 50
        }
    ]
};