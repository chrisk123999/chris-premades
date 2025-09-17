import {effectUtils, genericUtils} from '../../../../../utils.js';
import {psychicVeil} from './psychicVeil.js';
async function use({trigger, workflow}) {
    let effectData = {
        name: workflow.item.name + ' Used',
        img: workflow.item.img,
        origin: workflow.activity.uuid,
        flags: {
            dae: {
                specialDuration: [
                    'longRest'
                ]
            }
        }
    };
    await effectUtils.createEffect(workflow.actor, effectData, {
        unhideActivities: [
            {
                itemUuid: workflow.item.uuid,
                activityIdentifiers: ['restore']
            }
        ],
        identifier: 'rendMindRestoreEffect'
    });
}
async function restore({trigger, workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'rendMindRestoreEffect');
    if (effect) await genericUtils.remove(effect);
}
export let rendMind = {
    name: 'Rend Mind',
    version: '1.3.58',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['use']
            },
            {
                pass: 'rollFinished',
                macro: restore,
                priority: 50,
                activities: ['restore']
            }
        ]
    },
    item: psychicVeil.item,
    config: psychicVeil.config,
    scales: psychicVeil.scales
};