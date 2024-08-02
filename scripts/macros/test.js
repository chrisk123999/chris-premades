import {effectUtils} from '../utils.js';
async function create({trigger}) {
    let effect = effectUtils.getEffectByIdentifier(trigger.target.actor, trigger.identifier);
    if (effect) return;
    let effectData = {
        name: 'Test Aura',
        img: trigger.entity.img,
        origin: trigger.entity.uuid,
        duration: {
            seconds: 3600
        },
        flags: {
            'chris-premades': {
                aura: true
            }
        }
    };
    await effectUtils.createEffect(trigger.target.actor, effectData, {identifier: trigger.identifier});
}
function preEffect(effect, updates, options) {
    console.log(updates);
}
export let test = {
    name: 'test',
    version: '0.12.0',
    aura: [
        {
            pass: 'create',
            macro: create,
            priority: 50,
            distance: 15,
            identifier: 'testAura',
        }
    ],
    /*preCreateEffect: [
        {
            macro: preEffect
        }
    ],
    preUpdateEffect: [
        {
            macro: preEffect
        }
    ] */
};