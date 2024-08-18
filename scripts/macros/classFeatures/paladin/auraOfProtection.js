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
                key: 'system.bonuses.abilities.save',
                mode: 2,
                value: Math.max(item.actor.system.abilities.cha.mod, 1),
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
                showIcon
            }
        }
    };
    await effectUtils.createEffect(target.actor, effectData, {parentEntity: item, identifier: identifier + 'Aura'});
}
export let auraOfProtection = {
    name: 'Aura of Protection',
    version: '0.12.23',
    aura: [
        {
            pass: 'create',
            macro: create,
            priority: 50,
            distance: 'paladin',
            identifier: 'auraOfProtection',
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