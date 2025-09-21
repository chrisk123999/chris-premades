import {actorUtils} from '../../../utils.js';
async function turnStart({trigger: {token}}) {
    await actorUtils.setReactionUsed(token.actor);
}
export let noReactions = {
    name: 'No Reactions',
    version: '0.12.37',
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};