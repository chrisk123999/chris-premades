import {genericUtils} from '../../../utils.js';

async function use({workflow}) {
    await genericUtils.remove(workflow.item);
}
export let actionDismissal = {
    name: 'Action Dismissal',
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