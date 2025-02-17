import {workflowUtils} from '../../../utils.js';

async function use({trigger}) {
    if (trigger.entity.system.equipped === false) return;
    await workflowUtils.completeItemUse(trigger.entity);
}
export let useOnDeath = {
    name: 'Use on Death',
    version: '1.0.11',
    death: [
        {
            pass: 'dead',
            macro: use,
            priority: 50
        }
    ]
};