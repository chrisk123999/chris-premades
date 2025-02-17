import {effectUtils, genericUtils} from '../../../../utils.js';

async function use({workflow}) {
    let actor = workflow.targets.first()?.actor ?? workflow.actor;
    let poisoned = effectUtils.getEffectByStatusID(actor, 'poisoned');
    if (poisoned) await genericUtils.remove(poisoned);
    if (actor.system.attributes.exhaustion) {
        await genericUtils.update(actor, {'system.attributes.exhaustion': 0});
    }
}
export let potionOfVitality = {
    name: 'Potion of Vitality',
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