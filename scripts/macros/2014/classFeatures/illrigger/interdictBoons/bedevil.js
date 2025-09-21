import {itemUtils} from '../../../../../utils.js';
async function added({trigger: {entity: item}}) {
    await await itemUtils.correctActivityItemConsumption(item, ['use'], 'balefulInterdict');
}
export let interdictBoonBedevil = {
    name: 'Interdict Boons: Bedevil',
    version: '1.3.66',
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