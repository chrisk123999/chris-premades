import {actorUtils, automationUtils, constants, DamageBonus, documentUtils, rollUtils, workflowUtils} from '../../proxy.mjs';
import {attackTypeConfig, identifiersConfig} from './damageBonusToOneRoll.mjs';
export function addRiders(workflow, uuids) {
    const riders = workflowUtils.getWorkflowProperty(workflow, 'attackRiders') ?? [];
    workflowUtils.setWorkflowProperty(workflow, 'attackRiders', [...riders, ...uuids]);
}
function applies(activity, actor, workflow, config) {
    if (!workflow.hitTargets.size || workflow.activity?.uuid === activity.uuid) return false;
    if (config.workflowProperty && !workflowUtils.getWorkflowProperty(workflow, config.workflowProperty)) return false;
    if (config.identifiers.length && !config.identifiers.includes(documentUtils.getIdentifier(workflow.item))) return false;
    if (config.attackType && !workflowUtils.isAttackType(workflow, config.attackType)) return false;
    if (config.maxSize) {
        const maxSize = CONFIG.DND5E.actorSizes[config.maxSize]?.numerical;
        if (workflow.hitTargets.some(token => actorUtils.getSize(token.actor) > maxSize)) return false;
    }
    if (config.requiredItems.length && !actorUtils.getItemByIdentifiers(actor, config.requiredItems)) return false;
    if (config.suppressedBy.length && actorUtils.getItemByIdentifiers(actor, config.suppressedBy)) return false;
    return true;
}
export async function getTaggedRiders(actor, workflow, tag) {
    const activities = actor.items.contents.flatMap(item => item.system.activities?.contents ?? []).filter(activity => {
        if (!activity.flags?.cat?.macros?.roll?.some(macro => macro.identifier === 'attackRider')) return false;
        const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'attackRider', configKeys);
        return config.tag === tag && applies(activity, actor, workflow, config);
    });
    if (!activities.length) return {activities, limit: 0};
    const base = (await rollUtils.rollDice(automationUtils.getGenericConfigValue(activities[0], 'chris-premades', 'attackRider', 'limit'), {document: activities[0]})).total;
    const extra = await automationUtils.calledEvent('attackRiderLimit', actor, {multiResult: true, canOverlap: true, data: {tag, workflow}});
    return {activities, limit: base + extra.reduce((total, value) => total + (Number(value) || 0), 0)};
}
async function damage({document: activity, actor, workflow}) {
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'attackRider', configKeys);
    if (config.tag || !applies(activity, actor, workflow, config)) return;
    const bonus = new DamageBonus(activity, {formula: config.bonus})
        .withOnUse(({workflow, bonus}) => addRiders(workflow, [bonus.document.uuid]));
    if (config.useActivityCosts) {
        bonus.withDefaultCosts().initialize(workflow);
        if (!DamageBonus.CheckCost(bonus)) return;
    }
    return bonus;
}
async function rider({document: activity, actor, token, workflow}) {
    if (!workflowUtils.getWorkflowProperty(workflow, 'attackRiders')?.includes(activity.uuid)) return;
    const targets = activity.range.units === 'self' ? (token ? [token.document ?? token] : []) : Array.from(workflow.hitTargets, target => target.document ?? target);
    const costsPaid = automationUtils.getGenericConfigValue(activity, 'chris-premades', 'attackRider', 'useActivityCosts');
    const riderWorkflow = await workflowUtils.completeActivityUse(activity, targets, {consumeUsage: false, consumeResources: !costsPaid, spellSlot: !costsPaid});
    if (!riderWorkflow) return;
    await automationUtils.calledEvent('attackRiderUsed', actor, {canOverlap: true, data: {activity, riderWorkflow, targets, workflow}});
}
export const attackRider = {
    rules: 'all',
    version: '2.0.0',
    category: 'damage',
    generic: true,
    documents: ['activity'],
    notes: 'Use the "actorAttackRiderLimit" called event (async) to raise how many riders sharing a tag can apply to one damage roll. Return a number, which is added to the limit.\n\tData available: tag, workflow.\nUse "actorAttackRiderUsed" (async) to respond after a rider activity is rolled.\n\tData available: activity, riderWorkflow, targets, workflow.',
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: damage,
            priority: 255
        },
        {
            pass: 'actorRollFinished',
            macro: rider,
            priority: 200
        }
    ],
    genericConfig: {
        bonus: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageBonus',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.BonusHint'
        },
        tag: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.Tag',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.TagHint'
        },
        limit: {
            default: '1',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.Limit',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.LimitHint'
        },
        workflowProperty: {
            default: '',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.WorkflowProperty',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.WorkflowPropertyHint'
        },
        identifiers: identifiersConfig,
        attackType: attackTypeConfig,
        maxSize: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.MaxSize',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.MaxSizeHint',
            get options() { return [{value: '', label: 'CHRISPREMADES.Config.None'}, ...constants.sizeOptions()]; }
        },
        requiredItems: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.RequiredItems',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.RequiredItemsHint'
        },
        suppressedBy: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.AttackRider.SuppressedBy',
            hint: 'CHRISPREMADES.Macros.Generic.AttackRider.SuppressedByHint'
        },
        useActivityCosts: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.Costs'
        }
    }
};
const configKeys = Object.keys(attackRider.genericConfig);
