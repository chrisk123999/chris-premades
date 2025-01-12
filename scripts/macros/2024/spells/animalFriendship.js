import {actorUtils, constants, effectUtils, genericUtils} from '../../../utils.js';
async function early({trigger, workflow}) {
    if (!workflow.targets.size) return;
    await Promise.all(workflow.targets.map(async token => {
        if (actorUtils.typeOrRace(token.actor) === 'beast') return;
        await effectUtils.createEffect(token.actor, constants.immuneEffectData);
    }));
}
export let animalFriendship = {
    name: 'Animal Friendship',
    version: '1.1.12',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};