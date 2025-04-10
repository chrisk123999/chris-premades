import {activityUtils, actorUtils, constants, dialogUtils, genericUtils, itemUtils, rollUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
import {bardicInspiration} from '../bardicInspiration.js';
async function damage({trigger, workflow}) {
    if (!workflow.hitTargets.size || !workflow.damageRolls || !workflow.item || workflow.defaultDamageType === 'midi-none') return;
    let damageTypes = workflowUtils.getDamageTypes(workflow.damageRolls);
    if (['healing', 'temphp'].find(i => damageTypes.has(i))) return;
    let nearbyTokens = tokenUtils.findNearby(workflow.token, 60, 'enemy').filter(token => {
        if (actorUtils.hasUsedReaction(token.actor)) return;
        let cuttingWords = itemUtils.getItemByIdentifier(token.actor, 'cuttingWords');
        if (!cuttingWords) return;
        if (!itemUtils.getConfig(cuttingWords, 'damageRollsEnabled')) return;
        let bardicInspiration = itemUtils.getItemByIdentifier(token.actor, 'bardicInspiration');
        if (!bardicInspiration?.system?.uses?.value) return;
        return true;
    });
    if (!nearbyTokens.length) return;
    for (let token of nearbyTokens) {
        let item = itemUtils.getItemByIdentifier(token.actor, 'cuttingWords');
        let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.CuttingWords.Damage', {item: item.name, name: token.document.name}), {userId: socketUtils.firstOwner(token.actor, true)});
        if (!selection) continue;
        let result = await workflowUtils.syntheticItemRoll(item, [workflow.token], {consumeResources: true, userId: socketUtils.firstOwner(token.actor, true)});
        let total = -result.damageRolls[0].total;
        let value = workflow.damageTotal + total;
        if (value < 0) total -= value;
        await workflowUtils.bonusDamage(workflow, String(total), {damageType: workflow.defaultDamageType, ignoreCrit: true});
        break;
    }
}
async function check({trigger: {sourceActor, roll, config, skillId}}) {
    let targetValue = config.midiOptions?.target;
    if (!targetValue) return;
    if (roll.total < targetValue) return;
    let token = actorUtils.getFirstToken(sourceActor);
    if (!token) return;
    let nearbyTokens = tokenUtils.findNearby(token, 60, 'enemy').filter(token => {
        if (actorUtils.hasUsedReaction(token.actor)) return;
        let cuttingWords = itemUtils.getItemByIdentifier(token.actor, 'cuttingWords');
        if (!cuttingWords) return;
        if (!itemUtils.getConfig(cuttingWords, 'abilityChecksEnabled')) return;
        let bardicInspiration = itemUtils.getItemByIdentifier(token.actor, 'bardicInspiration');
        if (!bardicInspiration?.system?.uses?.value) return;
        return true;
    });
    if (!nearbyTokens.length) return;
    for (let token of nearbyTokens) {
        let item = itemUtils.getItemByIdentifier(token.actor, 'cuttingWords');
        let message = skillId ? 'CHRISPREMADES.Macros.CuttingWords.SkillCheck' : 'CHRISPREMADES.Macros.CuttingWords.AbilityCheck';
        let selection = await dialogUtils.queuedConfirmDialog(item.name, genericUtils.format(message, {item: item.name, name: token.document.name, total: roll.total}), {actor: token.actor, reason: 'reaction', userId: socketUtils.firstOwner(token.actor, true)});
        if (!selection) continue;
        let result = await workflowUtils.syntheticItemRoll(item, [token], {consumeResources: true, userId: socketUtils.firstOwner(token.actor, true)});
        let total = -result.damageRolls[0].total;
        return await rollUtils.addToRoll(roll, String(total), {rollData: roll.data});
    }
}
async function attack({trigger, workflow}) {
    if (!workflow.targets.size || !workflow.item || !constants.attacks.includes(workflow.activity.actionType) || workflow.isFumble || workflow.isCritical) return;
    if (workflow.targets.first().actor.system.attributes.ac.value > workflow.attackTotal) return;
    if (genericUtils.getIdentifier(workflow.item) === 'cuttingWords') return;
    let nearbyTokens = tokenUtils.findNearby(workflow.token, 60, 'enemy').filter(token => {
        if (actorUtils.hasUsedReaction(token.actor)) return;
        let cuttingWords = itemUtils.getItemByIdentifier(token.actor, 'cuttingWords');
        if (!cuttingWords) return;
        if (!itemUtils.getConfig(cuttingWords, 'attackRollsEnabled')) return;
        let bardicInspiration = itemUtils.getItemByIdentifier(token.actor, 'bardicInspiration');
        if (!bardicInspiration?.system?.uses?.value) return;
        return true;
    });
    if (!nearbyTokens.length) return;
    for (let token of nearbyTokens) {
        let item = itemUtils.getItemByIdentifier(token.actor, 'cuttingWords');
        let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.CuttingWords.Attack', {item: item.name, name: token.document.name, attack: workflow.attackTotal}), {userId: socketUtils.firstOwner(token.actor, true)});
        if (!selection) continue;
        let result = await workflowUtils.syntheticItemRoll(item, [workflow.token], {consumeResources: true, userId: socketUtils.firstOwner(token.actor, true)});
        await workflowUtils.bonusAttack(workflow, String(-result.damageRolls[0].total));
        break;
    }
}
async function added({trigger: {entity: item, identifier, actor}}) {
    let bardicInspiration = itemUtils.getItemByIdentifier(actor, 'bardicInspiration');
    if (!bardicInspiration) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'use');
    if (!activity) return;
    let path = 'system.activities.' + activity.id + '.consumption.targets';
    await genericUtils.update(item, {[path]: [
        {
            type: 'itemUses',
            value: 1,
            target: bardicInspiration.id,
            scaling: {
                mode: undefined,
                formula: undefined
            }
        }
    ]});
}
export let cuttingWords = {
    name: 'Cutting Words',
    version: '1.2.6',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'sceneDamageRollComplete',
                macro: damage,
                priority: 250
            },
            {
                pass: 'scenePostAttackRoll',
                macro: attack,
                priority: 250
            }
        ]
    },
    check: [
        {
            pass: 'sceneBonus',
            macro: check,
            priority: 50
        }
    ],
    skill: [
        {
            pass: 'sceneBonus',
            macro: check,
            priority: 50
        }
    ],
    createItem: [
        {
            pass: 'created',
            macro: added
        }
    ],
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'bard',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'scaleIdentifier',
            label: 'CHRISPREMADES.Config.ScaleIdentifier',
            type: 'text',
            default: 'bardic-inspiration',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'damageRollsEnabled',
            label: 'CHRISPREMADES.Macros.CuttingWords.DamageRollsEnabled',
            type: 'checkbox',
            default: true,
            category: 'mechanics'
        },
        {
            value: 'attackRollsEnabled',
            label: 'CHRISPREMADES.Macros.CuttingWords.AttackRollsEnabled',
            type: 'checkbox',
            default: true,
            category: 'mechanics'
        },
        {
            value: 'abilityChecksEnabled',
            label: 'CHRISPREMADES.Macros.CuttingWords.AbilityChecksEnabled',
            type: 'checkbox',
            default: true,
            category: 'mechanics'
        }
    ],
    scales: bardicInspiration.scales
};