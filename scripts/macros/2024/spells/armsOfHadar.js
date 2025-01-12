import {actorUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.failedSaves.size) return;
    await Promise.all(workflow.failedSaves.map(async token => {
        await actorUtils.setReactionUsed(token.actor);
    }));
}
export let armsOfHadar = {
    name: 'Arms of Hadar',
    version: '1.1.12',
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