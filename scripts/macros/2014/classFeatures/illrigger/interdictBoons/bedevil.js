import {itemUtils} from '../../../../../utils.js';
async function added({trigger: {entity: item}}) {
    await itemUtils.multiCorrectActivityItemConsumption(item, ['use'], {
        0: 'balefulInterdict',
        1: 'interdictBoons'
    });
}
export let interdictBoonBedevil = {
    name: 'Interdict Boons: Bedevil',
    aliases: ['Bedevil'],
    version: '1.3.76',
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