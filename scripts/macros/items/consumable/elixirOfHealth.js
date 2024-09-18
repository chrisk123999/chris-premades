import {effectUtils, genericUtils} from '../../../utils.js';

async function use({workflow}) {
    let actor = workflow.targets.first()?.actor ?? workflow.actor;
    for (let condition of ['blinded', 'deafened', 'paralyzed', 'poisoned']) {
        let effect = effectUtils.getEffectByStatusID(actor, condition);
        if (effect) await genericUtils.remove(effect);
    }
}
export let elixirOfHealth = {
    name: 'Elixir of Health',
    version: '0.12.70',
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