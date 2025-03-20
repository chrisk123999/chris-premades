import {workflowUtils} from '../../../utils.js';

async function use({workflow}) {
    await workflowUtils.handleInstantTemplate(workflow);
}
export let synapticStatic = {
    name: 'Synaptic Static',
    version: '1.2.29',
    rules: 'modern',
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