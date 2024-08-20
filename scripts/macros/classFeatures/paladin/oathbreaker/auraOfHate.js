import {actorUtils, combatUtils, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';

async function create({trigger: {entity: item, target, identifier}}) {
    if (itemUtils.getConfig(item, 'combatOnly') && !combatUtils.inCombat()) return;
    if (target.actor !== item.actor && !['undead', 'fiend'].includes(actorUtils.typeOrRace(target.actor))) return;
    let targetEffect = effectUtils.getEffectByIdentifier(target.actor, identifier);
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
                key: 'system.bonuses.mwak.damage',
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
    // await effectUtils.createEffect(target.actor, effectData, {parentEntity: item, identifier});
    return {
        effectData,
        effectOptions: {
            parentEntity: item,
            identifier
        }
    };
}
export let auraOfHate = {
    name: 'Aura of Hate',
    version: '0.12.26',
    aura: [
        {
            pass: 'create',
            macro: create,
            priority: 50,
            distance: 'paladin',
            identifier: 'auraOfHateAura',
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