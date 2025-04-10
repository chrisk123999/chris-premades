import {combatUtils, effectUtils, genericUtils, itemUtils} from '../../../../../utils.js';
async function ally({trigger: {entity: item, target, identifier}}) {
    let targetEffect = effectUtils.getEffectByIdentifier(target.actor, identifier);
    if (targetEffect) return;
    if (itemUtils.getConfig(item, 'combatOnly') && !combatUtils.inCombat()) return;
    let showIcon = itemUtils.getConfig(item, 'showIcon');
    let sourceEffect = itemUtils.getEffectByIdentifier(item, 'auraOfClarityAllyAura');
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = item.uuid;
    genericUtils.setProperty(effectData, 'flags.chris-premades.aura', true);
    genericUtils.setProperty(effectData, 'flags.dae.showIcon', showIcon);
    genericUtils.setProperty(effectData, 'flags.chris-premades.effect.noAnimation', true);
    return {
        effectData,
        effectOptions: {
            parentEntity: item,
            identifier: 'auraOfClarityAllyAura'
        }
    };
}
async function enemy({trigger: {entity: item, target, identifier}}) {
    let targetEffect = effectUtils.getEffectByIdentifier(target.actor, identifier);
    if (targetEffect) return;
    if (itemUtils.getConfig(item, 'combatOnly') && !combatUtils.inCombat()) return;
    let showIcon = itemUtils.getConfig(item, 'showIcon');
    let sourceEffect = itemUtils.getEffectByIdentifier(item, 'auraOfClarityEnemyAura');
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = item.uuid;
    genericUtils.setProperty(effectData, 'flags.chris-premades.aura', true);
    genericUtils.setProperty(effectData, 'flags.dae.showIcon', showIcon);
    genericUtils.setProperty(effectData, 'flags.chris-premades.effect.noAnimation', true);
    return {
        effectData,
        effectOptions: {
            parentEntity: item,
            identifier: 'auraOfClarityEnemyAura'
        }
    };
}
export let auraOfClarity = {
    name: 'Aura of Clarity',
    version: '1.2.32',
    aura: [
        {
            pass: 'create',
            macro: ally,
            priority: 50,
            distance: 'paladin',
            identifier: 'auraOfClarityAllyAura',
            disposition: 'ally'
        },
        {
            pass: 'create',
            macro: enemy,
            priority: 50,
            distance: 'paladin',
            identifier: 'auraOfClarityEnemyAura',
            disposition: 'enemy'
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