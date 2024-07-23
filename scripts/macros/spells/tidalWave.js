import {workflowUtils} from '../../utils.js';

async function use({workflow}) {
    await workflowUtils.handleInstantTemplate(workflow);
}
export let tidalWave = {
    name: 'Tidal Wave',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};