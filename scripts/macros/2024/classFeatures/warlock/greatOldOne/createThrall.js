import {combatUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function early({activity, config, trigger: {entity: item}}) {
    if (config.midiOptions?.workflowOptions?.['chris-premades']?.createThrall) return;
    if (genericUtils.getIdentifier(activity.item) !== 'summonAberration') return;
    if (!await dialogUtils.confirmUseItem(item)) return;
    let itemData = activity.item.toObject();
    let activityData = activity.toObject();
    let duration = {
        concentration: false,
        units: 'minute',
        value: 1
    };
    itemData.system.duration = duration;
    activityData.duration = duration;
    itemData.system.properties = itemData.system.properties.filter(p => p !== 'concentration');
    itemData.system.activities[activity.id] = activityData;
    let newItem = await itemUtils.syntheticItem(itemData, item.parent);
    activity = newItem.system.activities.get(activity.id);
    await workflowUtils.syntheticActivityRoll(activity, [], {
        spellSlot: true,
        options: {
            configureDialog: true,
            workflowOptions: {
                'chris-premades': {
                    createThrall: true
                }
            }
        }
    });
    await item.displayCard();
    return true;
}
export function addThrallBonuses(summonData, workflow) {
    let feature = itemUtils.getItemByIdentifier(workflow.actor, 'createThrall');
    if (!feature) return summonData;
    let classIdentifier = itemUtils.getConfig(feature, 'classIdentifier');
    let ability = itemUtils.getConfig(feature, 'ability');
    let levels = workflow.actor.classes[classIdentifier]?.system.levels;
    let mod = workflow.actor.system.abilities[ability]?.mod ?? 0;
    if (!levels) return summonData;
    let damageType = itemUtils.getConfig(feature, 'damageType');
    genericUtils.setProperty(summonData, 'actor.system.attributes.hp.temp', levels + mod);
    genericUtils.setProperty(summonData, 'actor.effects', [{
        name: feature.name,
        img: feature.img,
        origin: feature.origin,
        changes: [
            {
                key: 'flags.chris-premades.hexBonusDamageType',
                mode: 5,
                value: damageType,
                priority: 20
            },
            {
                key: 'flags.chris-premades.summonerUuid',
                mode: 5,
                value: workflow.actor.uuid,
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                rules: thrallBonus.rules,
                macros: {
                    midi: {
                        actor: ['thrallBonus']
                    }
                }
            }
        }
    }]);
    return summonData;
}
async function hexBonus({trigger: {entity: effect}, workflow}) {
    if (!workflow.targets.size) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    if (!combatUtils.perTurnCheck(effect, 'thrallHexBonus')) return;
    let summoner = await fromUuid(workflow.actor.flags['chris-premades']?.summonerUuid);
    if (!summoner) return;
    let hex = effectUtils.getEffectByIdentifier(summoner, 'hex');
    if (!hex) return;
    let validTargetUuids = hex.flags['chris-premades'].hex.targets;
    if (!workflow.hitTargets.find(i => validTargetUuids.includes(i.document.uuid))) return;
    let damageType = workflow.actor.flags['chris-premades']?.hexBonusDamageType ?? 'psychic';
    let formula = hex.flags['chris-premades'].hex.formula;
    await combatUtils.setTurnCheck(effect, 'thrallHexBonus');
    await workflowUtils.bonusDamage(workflow, formula, {damageType});
}
export let createThrall = {
    name: 'Create Thrall',
    version: '1.5.21',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'preTargeting',
                macro: early,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'warlock',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'ability',
            label: 'CHRISPREMADES.Config.Ability',
            type: 'select',
            default: 'cha',
            options: constants.abilityOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'psychic',
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let thrallBonus = {
    name: 'Thrall Hex Bonus',
    version: createThrall.version,
    rules: createThrall.rules,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: hexBonus,
                priority: 250
            }
        ]
    }
};
