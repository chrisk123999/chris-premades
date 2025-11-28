import {actorUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    for (let target of workflow.targets) {
        await actorUtils.giveHeroicInspiration(target.actor);
    }
}
export let purpleDragonRook = {
    name: 'Purple Dragon Rook',
    version: '1.3.147',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    ddbi: {
        removeChoices: [
            'Purple Dragon Rook'
        ]
    }
};