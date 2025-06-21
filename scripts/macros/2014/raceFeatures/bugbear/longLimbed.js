import {effectUtils} from '../../../../utils.js';

async function turnStart({trigger: {entity: item}}) {
    let actor = item.actor;
    if (!actor) return;
    let effectData = {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        duration: {
            turns: 1
        },
        changes: [
            {
                key: 'flags.midi-qol.range.mwak',
                mode: 2,
                value: genericUtils.handleMetric(5),
                priority: 20
            },
            {
                key: 'flags.midi-qol.range.msak',
                mode: 2,
                value: genericUtils.handleMetric(5),
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    await effectUtils.createEffect(actor, effectData);
}
export let longLimbed = {
    name: 'Long-Limbed',
    version: '1.1.0',
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};