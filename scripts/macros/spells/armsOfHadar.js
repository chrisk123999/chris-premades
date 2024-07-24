import {actorUtils} from '../../utils.js';

async function use({workflow}) {
    for (let target of workflow.failedSaves) {
        await actorUtils.setReactionUsed(target.actor);
    }
}
export let armsOfHadar = {
    name: 'Arms of Hadar',
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