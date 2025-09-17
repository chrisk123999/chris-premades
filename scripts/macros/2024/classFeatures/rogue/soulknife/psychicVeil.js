import {effectUtils, genericUtils, itemUtils} from '../../../../../utils.js';
import {psionicPower} from './psionicPower.js';
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
        identifier: 'psychicVeilRestoreEffect'
    });
}
async function restore({trigger, workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'psychicVeilRestoreEffect');
    if (effect) await genericUtils.remove(effect);
}
async function added({trigger: {entity: item}}) {
    await itemUtils.correctActivityItemConsumption(item, ['restore'], 'psionicPower');
    await itemUtils.fixScales(item);
}
export let psychicVeil = {
    name: 'Psychic Veil',
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
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 50
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 50
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 50
        }
    ],
    config: psionicPower.config,
    scales: psionicPower.scales
};