import {workflowUtils} from '../../utils.js';

async function use({workflow}) {
    await workflowUtils.handleInstantTemplate(workflow);
}
export let vitriolicSphere = {
    name: 'Vitriolic Sphere',
    version: '1.1.0',
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