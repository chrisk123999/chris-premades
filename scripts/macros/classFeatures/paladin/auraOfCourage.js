import {effectUtils, genericUtils, itemUtils} from '../../../utils.js';

async function create({trigger: {entity: item, target, identifier}}) {
    let targetEffect = effectUtils.getEffectByIdentifier(target.actor, identifier + 'Aura');
    if (targetEffect) {
        if (targetEffect.origin === item.uuid) return;
        await genericUtils.remove(targetEffect);
    }
    let showIcon = itemUtils.getConfig(item, 'showIcon');
    let effectData = {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        changes: [
            {
                key: 'system.traits.ci.value',
                mode: 0,
                value: 'frightened',
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                aura: true,
                effect: {
                    noAnimation: true
                }
            },
            dae: {
                showIcon: showIcon
            }
        }
    };
    await effectUtils.createEffect(target.actor, effectData, {parentEntity: item, identifier: identifier + 'Aura'});
}
export let auraOfCourage = {
    name: 'Aura of Courage',
    version: '0.12.23',
    aura: [
        {
            pass: 'create',
            macro: create,
            priority: 50,
            distance: 'paladin',
            identifier: 'auraOfCourageAura',
            disposition: 'ally',
            conscious: true
        }
    ],
    config: [
        {
            value: 'showIcon',
            label: 'CHRISPREMADES.Config.ShowIcon',
            type: 'checkbox',
            default: true,
            category: 'visuals'
        }
    ]
};