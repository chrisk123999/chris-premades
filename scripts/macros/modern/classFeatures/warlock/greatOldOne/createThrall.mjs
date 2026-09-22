import {actorUtils, automationUtils, combatUtils, constants, dialogUtils, documentUtils, genericUtils, itemUtils, tokenUtils, workflowUtils, DamageBonus} from '../../../../../proxy.mjs';
async function early({document, activity, config}) {
    if (config.midiOptions?.workflowOptions?.['chris-premades']?.createThrall) return;
    if (documentUtils.getIdentifier(activity.item) !== automationUtils.getConfigValue(document, 'spellIdentifier')) return;
    if (!await dialogUtils.confirmUseItem(document)) return;
    const duration = {concentration: false, units: 'minute', value: 1};
    const itemData = activity.item.toObject();
    const activityData = activity.toObject();
    activityData.duration = duration;
    itemData.system.duration = duration;
    itemData.system.properties = itemData.system.properties.filter(property => property !== 'concentration');
    itemData.system.activities[activity.id] = activityData;
    const newItem = itemUtils.syntheticItem(itemData, document.actor);
    await workflowUtils.completeActivityUse(newItem.system.activities.get(activity.id), [], {
        options: {workflowOptions: {'chris-premades': {createThrall: true}}}
    });
    await workflowUtils.completeItemUse(document, [], {consumeUsage: false, consumeResources: false});
    return true;
}
export function addThrallBonuses(summonData, workflow) {
    const feature = actorUtils.getItemByIdentifier(workflow.actor, 'create-thrall');
    if (!feature) return summonData;
    const classIdentifier = automationUtils.getConfigValue(feature, 'classIdentifier');
    const ability = automationUtils.getConfigValue(feature, 'ability');
    const levels = workflow.actor.classes[classIdentifier]?.system.levels;
    if (!levels) return summonData;
    const mod = workflow.actor.system.abilities[ability]?.mod ?? 0;
    const damageType = automationUtils.getConfigValue(feature, 'damageType');
    genericUtils.setProperty(summonData, 'system.attributes.hp.temp', levels + mod);
    genericUtils.setProperty(summonData, 'effects', [documentUtils.getBaseEffectData(feature, {
        name: feature.name,
        img: feature.img,
        origin: feature.uuid,
        identifier: 'thrallBonus',
        macros: [{type: 'roll', macros: [{source: 'chris-premades', rules: '2024', identifier: 'thrall-bonus'}]}],
        changes: [
            {
                key: 'flags.chris-premades.hexBonusDamageType',
                type: 'override',
                value: damageType,
                priority: 20
            },
            {
                key: 'flags.chris-premades.summonerUuid',
                type: 'override',
                value: workflow.actor.uuid,
                priority: 20
            }
        ]
    })]);
    return summonData;
}
async function hexBonus({document, workflow, token}) {
    if (!workflow.hitTargets.size || !workflowUtils.isAttackType(workflow, 'attack')) return;
    const combatData = tokenUtils.getCombatData(token);
    const stamps = genericUtils.getProperty(document, 'flags.cat.thrallBonus.stamps') ?? [];
    if (combatUtils.isStampedThisTurn(stamps, token.id, combatData)) return;
    const summoner = await fromUuid(workflow.actor.flags['chris-premades']?.summonerUuid);
    if (!summoner) return;
    const hex = documentUtils.getEffectByIdentifier(summoner, 'hex');
    const hexData = hex?.flags['chris-premades']?.hex;
    if (!hexData) return;
    const targets = Array.from(workflow.hitTargets, target => target.document).filter(target => hexData.targets.includes(target.uuid));
    if (!targets.length) return;
    const damageType = workflow.actor.flags['chris-premades']?.hexBonusDamageType ?? 'psychic';
    await documentUtils.update(document, {'flags.cat.thrallBonus.stamps': combatUtils.addTurnStamp(stamps, token.id, combatData)});
    const bonus = new DamageBonus(document, {formula: hexData.formula, optional: false, type: damageType});
    bonus.targets = targets;
    return bonus;
}
export const createThrall = {
    name: 'Create Thrall',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {pass: 'actorPreTargeting', macro: early, priority: 50}
    ],
    config: {
        spellIdentifier: {
            default: 'summon-aberration',
            type: 'text',
            label: 'CHRISPREMADES.Config.Identifiers',
            category: 'homebrew'
        },
        classIdentifier: {
            default: 'warlock',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'homebrew'
        },
        ability: {
            default: 'cha',
            type: 'select',
            label: 'CHRISPREMADES.Config.Ability',
            category: 'homebrew',
            get options() { return constants.abilityOptions(); }
        },
        damageType: {
            default: 'psychic',
            type: 'select',
            label: 'CHRISPREMADES.Config.DamageType',
            category: 'homebrew',
            get options() { return constants.damageTypeOptions(); }
        }
    }
};
export const thrallBonus = {
    name: 'Thrall Hex Bonus',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {pass: 'actorOptionalBonusDamage', phase: 'postResult', macro: hexBonus, priority: 250}
    ]
};
