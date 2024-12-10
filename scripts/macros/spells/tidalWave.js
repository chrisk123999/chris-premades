import {workflowUtils} from '../../utils.js';
import {proneOnFail} from '../generic/proneOnFail.js';

async function proneOnFailMacro({workflow}) {
    await workflowUtils.handleInstantTemplate(workflow);
    await proneOnFail.midi.item[0].macro({workflow});
}
export let tidalWave = {
    name: 'Tidal Wave',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: proneOnFailMacro,
                priority: 50
            }
        ]
    }
};