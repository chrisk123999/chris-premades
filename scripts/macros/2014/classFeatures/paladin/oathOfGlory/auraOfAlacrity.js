import {effectUtils, genericUtils, tokenUtils} from '../../../../../utils.js';

async function turnStart({trigger: {entity: item, token, target}}) {
    if (!token.actor.system.attributes.hp.value) return;
    if (effectUtils.getEffectByStatusID(token.actor, 'unconscious') || effectUtils.getEffectByStatusID(token.actor, 'dead')) return;
    let distance = tokenUtils.getDistance(token, target);
    let auraDistance = genericUtils.handleMetric(5);
    if (token.actor.classes.paladin?.system.levels >= 18) auraDistance = genericUtils.handleMetric(10);
    if (distance > auraDistance) return;
    let effect = effectUtils.getEffectByIdentifier(target.actor, 'auraOfAlacrity');
    if (effect) await genericUtils.remove(effect);
    let effectData = {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        duration: {
            turns: 1
        },
        changes: [
            {
                key: 'system.attributes.movement.walk',
                mode: 2,
                value: genericUtils.handleMetric(10),
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
    await effectUtils.createEffect(target.actor, effectData, {identifier: 'auraOfAlacrity'});
}
export let auraOfAlacrity = {
    name: 'Aura of Alacrity',
    version: '1.1.0',
    combat: [
        {
            pass: 'turnStartNear',
            macro: turnStart,
            priority: 50,
            distance: 10,
            disposition: 'ally'
        }
    ]
};