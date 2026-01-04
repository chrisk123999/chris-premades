import {itemUtils} from '../../../../utils.js';
import {wildShape} from '../../classFeatures/druid/wildShape.js';
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['use'], 'wildShape');
}
export let maskOfMonstrousForms = {
    name: 'Mask of Monstrous Forms',
    version: '1.4.12',
    rules: 'modern',
    midi: wildShape.midi,
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
    ],
    config: [wildShape.config[0]]
};