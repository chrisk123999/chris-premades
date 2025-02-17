import {effectUtils, genericUtils} from '../../../utils.js';

async function use({workflow}) {
    let effect = effectUtils.getEffectByStatusID(workflow.actor, 'prone');
    if (effect) await genericUtils.remove(effect);
    // TODO: remove parent stuff?
}
export let bulwark = {
    name: 'Vigor of the Hill Giant: Bulwark',
    version: '1.1.0',
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