import {activityUtils, actorUtils, automationUtils, combatUtils, constants, dialogUtils, documentUtils, queryUtils, rollUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
import {attackTypeConfig} from './damageBonusToOneRoll.mjs';
function isMagical(workflow) {
    if (workflow.item?.type === 'spell' || workflow.item?.system.properties?.has('mgc')) return true;
    return !!(workflow.activity?.midiProperties?.magicEffect || workflow.activity?.midiProperties?.magicDamage);
}
async function damage({document: item, ditem, workflow, targetToken, macroClass: {identifier}}) {
    if (!ditem.isHit || ditem.totalDamage <= 0) return;
    const ownTarget = targetToken.actor === item.actor;
    if (!ownTarget && !Number(automationUtils.getGenericConfigValue(item, 'chris-premades', identifier, 'range'))) return;
    const config = automationUtils.getGenericConfigValues(item, 'chris-premades', identifier, configKeys);
    const bearerToken = ownTarget ? targetToken : actorUtils.getFirstToken(item.actor);
    if (!bearerToken || bearerToken.parent !== targetToken.parent) return;
    if (!ownTarget) {
        if (config.alliesOnly && tokenUtils.isEnemy(bearerToken, targetToken)) return;
        if (!tokenUtils.isWithinDistance(bearerToken, targetToken, Number(config.range))) return;
    }
    if (config.source === 'magical' && !isMagical(workflow)) return;
    if (config.source === 'attack' && !workflowUtils.isAttackType(workflow, 'attack')) return;
    if (config.attackType && !workflowUtils.isAttackType(workflow, config.attackType)) return;
    if (config.damageTypes.length && !workflowUtils.getDamageTypes(workflow.damageRolls).intersects(new Set(config.damageTypes))) return;
    if (config.skipIncapacitated && item.actor.statuses.has('incapacitated')) return;
    const combatData = tokenUtils.getCombatData(bearerToken);
    const stamps = item.flags['chris-premades']?.reduceDamageTaken?.stamps ?? [];
    if (config.oncePerTurn && combatUtils.isStampedThisTurn(stamps, bearerToken.id, combatData)) return;
    const activity = config.rollActivity.map(id => item.system.activities.get(id)).find(candidate => candidate && activityUtils.checkCosts(candidate));
    if (!activity) return;
    if (activity.activation.type === 'reaction' && actorUtils.hasUsedReaction(item.actor)) return;
    if (config.confirm) {
        const userId = queryUtils.firstOwner(item.actor, true);
        const selection = ownTarget
            ? await dialogUtils.confirmUseItem(item, {userId})
            : await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.All.Interception.Prompt', {item: item.name, name: targetToken.name}), {userId});
        if (!selection) return;
    }
    const useWorkflow = await workflowUtils.completeActivityUse(activity, [], {fast: true});
    const amount = rollUtils.getRollsTotal(useWorkflow?.utilityRolls ?? []);
    if (amount > 0) workflowUtils.modifyDamageAppliedFlat(ditem, -amount);
    if (config.oncePerTurn && combatData.inCombat) await documentUtils.setFlag(item, 'chris-premades', 'reduceDamageTaken.stamps', combatUtils.addTurnStamp(stamps, bearerToken.id, combatData));
}
/**
 * Rolls an activity to reduce damage taken by the owner, or by creatures near it.
 * Bound on an item. Fires on `sceneDamageFlatReductions`.
 *
 * Config:
 * - `rollActivity`: rolled when it triggers. The first one whose costs can be paid is used; its roll total is the reduction.
 * - `range`: also protect other creatures within this distance. 0 protects the owner only.
 * - `alliesOnly`: with a range, only protect allies of the owner.
 * - `source`: only reduce damage from any source, magical sources or attacks.
 * - `attackType`: only reduce damage from this attack type.
 * - `damageTypes`: only reduce damage that includes one of these types.
 * - `oncePerTurn`: at most once per turn in combat.
 * - `skipIncapacitated`: does not trigger while the owner is incapacitated.
 * - `confirm`: prompt the owner before using it.
 */
export const reduceDamageTaken = {
    rules: 'all',
    version: '2.1.9',
    category: 'damage',
    generic: true,
    documents: ['item'],
    roll: [
        {
            pass: 'sceneDamageFlatReductions',
            macro: damage,
            priority: 400,
            canOverlap: true
        }
    ],
    genericConfig: {
        rollActivity: {
            default: [],
            type: 'selectActivities',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ReduceDamageTaken.RollActivity',
            hint: 'CHRISPREMADES.Macros.Generic.ReduceDamageTaken.RollActivityHint'
        },
        range: {
            default: '0',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range',
            hint: 'CHRISPREMADES.Macros.Generic.ReduceDamageTaken.RangeHint'
        },
        alliesOnly: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ReduceDamageTaken.AlliesOnly'
        },
        source: {
            default: 'any',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ReduceDamageTaken.Source',
            options: [
                {label: 'CHRISPREMADES.Macros.Generic.ReduceDamageTaken.Any', value: 'any'},
                {label: 'CHRISPREMADES.Macros.Generic.ReduceDamageTaken.Magical', value: 'magical'},
                {label: 'CHRISPREMADES.Macros.Generic.ReduceDamageTaken.Attack', value: 'attack'}
            ]
        },
        attackType: attackTypeConfig,
        damageTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageTypes',
            hint: 'CHRISPREMADES.Macros.Generic.Common.DamageTypeHint',
            get options() { return constants.damageTypeOptions; }
        },
        oncePerTurn: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ReduceDamageTaken.OncePerTurn'
        },
        skipIncapacitated: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ReduceDamageTaken.SkipIncapacitated'
        },
        confirm: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.ReduceDamageTaken.Confirm'
        }
    }
};
const configKeys = Object.keys(reduceDamageTaken.genericConfig);
