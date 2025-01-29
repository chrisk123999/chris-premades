import {actorUtils, combatUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function create({trigger: {entity: item, target, identifier}}) {
    if (itemUtils.getConfig(item, 'combatOnly') && !combatUtils.inCombat()) return;
    let targetEffect = effectUtils.getEffectByIdentifier(target.actor, identifier);
    if (targetEffect) return;
    let frightened = effectUtils.getEffectByStatusID(target.actor, 'frightened');
    if (!frightened) return;
    let validKeys = ['macro.CE', 'macro.CUB', 'macro.StatusEffect', 'StatusEffect'];
    let frightenedOfActor = actorUtils.getEffects(target.actor).find(async i => 
        (
            i.statuses.has('frightened') || // Status Effect dropdown on details page
            i.flags['chris-premades']?.conditions?.includes('frightened') || // CPR effect medkit
            i.changes.find(j => validKeys.includes(j.key) && j.value.toLowerCase() === 'frightened') // dae/midi key
        )
        && await effectUtils.getOriginItem(i)?.actor === item.actor
    );
    if (!frightenedOfActor) return;
    let showIcon = itemUtils.getConfig(item, 'showIcon');
    let effectData = {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        changes: [
            {
                key: 'system.attributes.movement.all',
                mode: 0,
                value: 0,
                priority: 100
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
    effectUtils.addMacro(effectData, 'combat', ['auraOfConquestAura']);
    return {
        effectData,
        effectOptions: {
            parentEntity: item,
            identifier
        }
    };
}
async function turnStart({trigger: {entity: effect, token}}) {
    let originItem = await effectUtils.getOriginItem(effect);
    let originActor = originItem?.actor;
    if (!originActor) return;
    let frightened = effectUtils.getEffectByStatusID(token.actor, 'frightened');
    if (!frightened) return;
    let damageRoll = await new CONFIG.Dice.DamageRoll('floor(@classes.paladin.levels / 2)', originActor.getRollData(), {type: 'psychic'}).evaluate();
    await workflowUtils.applyWorkflowDamage(actorUtils.getFirstToken(originActor), damageRoll, 'psychic', [token], {flavor: effect.name, sourceItem: originItem});
}
export let auraOfConquest = {
    name: 'Aura of Conquest',
    version: '1.1.0',
    aura: [
        {
            pass: 'create',
            macro: create,
            priority: 50,
            distance: 'paladin',
            identifier: 'auraOfConquestAura',
            disposition: 'enemy',
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
export let auraOfConquestAura = {
    name: 'Aura of Conquest: Aura',
    version: '0.12.28',
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};