import {combatUtils, constants, effectUtils} from '../../../utils.js';
async function early({trigger, workflow}) {
    if (!workflow.targets.size) return;
    await Promise.all(workflow.targets.map(async token => {
        if (combatUtils.inCombat()) await effectUtils.createEffect(token.actor, constants.advantageEffectData);
    }));
}
export let charmMonster = {
    name: 'Charm Monster',
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