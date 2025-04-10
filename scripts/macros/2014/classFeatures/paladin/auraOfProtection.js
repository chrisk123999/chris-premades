import {combatUtils, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function create({trigger: {entity: item, target, identifier}}) {
    let targetEffect = effectUtils.getEffectByIdentifier(target.actor, identifier);
    if (targetEffect) return;
    if (itemUtils.getConfig(item, 'combatOnly') && !combatUtils.inCombat()) return;
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
                showIcon: showIcon
            }
        }
    };
    return {
        effectData,
        effectOptions: {
            parentEntity: item,
            identifier
        }
    };
}
export let auraOfProtection = {
    name: 'Aura of Protection',
    version: '1.1.0',
    aura: [
        {
            pass: 'create',
            macro: create,
            priority: 50,
            distance: 'paladin',
            identifier: 'auraOfProtectionAura',
            disposition: 'ally',
            conscious: true
        }
    ],
    config: [
        {
            value: 'combatOnly',
            label: 'CHRISPREMADES.Config.CombatOnly',
            type: 'checkbox',
            default: false,
            category: 'mechanics'
        },
        {
            value: 'showIcon',
            label: 'CHRISPREMADES.Config.ShowIcon',
            type: 'checkbox',
            default: true,
            category: 'visuals'
        }
    ]
};