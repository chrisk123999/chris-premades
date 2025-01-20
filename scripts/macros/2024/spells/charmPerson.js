import {actorUtils, combatUtils, constants, effectUtils} from '../../../utils.js';
async function early({trigger, workflow}) {
    if (!workflow.targets.size) return;
    await Promise.all(workflow.targets.map(async token => {
        if (actorUtils.typeOrRace(token.actor) != 'humanoid') {
            await effectUtils.createEffect(token.actor, constants.immuneEffectData);
            return;
        }
        if (combatUtils.inCombat()) await effectUtils.createEffect(token.actor, constants.advantageEffectData);
    }));

}
export let charmPerson = {
    name: 'Charm Person',
    version: '1.1.19',
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