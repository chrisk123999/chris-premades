import {effectUtils, genericUtils, itemUtils} from '../../../../../utils.js';

async function use({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'echoAvatar');
    if (effect) {
        genericUtils.remove(effect);
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        flags: {
            'chris-premades': {
                conditions: ['blinded', 'deafened']
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'echoAvatar'});
}
export let echoAvatar = {
    name: 'Echo Avatar',
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