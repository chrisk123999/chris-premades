import {itemUtils} from '../../utils.js';
async function use({trigger}) {
    if (trigger.entity.system.equipped === false) return;
    await trigger.entity.use();
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