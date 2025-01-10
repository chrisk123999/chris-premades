import {workflowUtils} from '../../utils.js';

async function use({workflow}) {
    await workflowUtils.handleInstantTemplate(workflow);
}

export let sprayOfCards = {
    name: 'Spray of Cards',
    version: '1.1.10',
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