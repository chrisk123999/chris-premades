import {itemUtils} from '../../../../../utils.js';
async function added({trigger: {entity: item}}) {
    await itemUtils.multiCorrectActivityItemConsumption(item, ['use'], {
        0: 'balefulInterdict',
        1: 'interdictBoons'
    });
}
export let interdictBoonHellsight = {
    name: 'Interdict Boons: Hellsight',
    aliases: ['Hellsight'],
    version: '1.7.76',
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