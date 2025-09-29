import {itemUtils, tokenUtils} from '../../../../../utils.js';
import {proneOnFail} from '../../../generic/proneOnFail.js';
async function push({trigger, workflow}) {
    if (!workflow.token || !workflow.failedSaves.size) return;
    await tokenUtils.pushToken(workflow.token, workflow.failedSaves.first(), 15);
}
async function added({trigger: {entity: item}}) {
    await itemUtils.multiCorrectActivityItemConsumption(item, ['push', 'prone'], {
        0: 'balefulInterdict',
        1: 'interdictBoons'
    });
}
export let telekineticSeal = {
    name: 'Dispater\'s Interdiction: Telekinetic Seal',
    version: '1.3.78',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: push,
                priority: 50,
                activities: ['push']
            },
            {
                pass: 'rollFinished',
                macro: proneOnFail.midi.item[0].macro,
                priority: 50,
                activities: ['prone']
            }
        ]
    },
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