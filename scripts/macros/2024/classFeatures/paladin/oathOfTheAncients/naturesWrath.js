import {itemUtils} from '../../../../../utils.js';
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['use'], 'channelDivinityPaladin');
}
export let naturesWrath = {
    name: 'Nature\'s Wrath',
    version: '1.5.28',
    rules: 'modern',
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