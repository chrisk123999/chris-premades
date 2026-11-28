import {activityUtils, actorUtils, automationUtils, combatUtils, dialogUtils, documentUtils, Logging, queryUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
async function use(activity, token, event, targets) {
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'useOnEvent', configKeys);
    if (!config.events.includes(event)) return;
    if (event === 'long' && config.events.includes('short')) return;
    if (['turnStart', 'turnEnd'].includes(event) && !config.whileIncapacitated && activity.actor.statuses.has('incapacitated')) return;
    if (config.requiredEffects.length && !actorUtils.getEffects(activity.actor).some(effect => config.requiredEffects.includes(documentUtils.getIdentifier(effect)))) return;
    if (!activityUtils.checkCosts(activity)) return Logging.addMacroWarning('chris-premades', documentUtils.getIdentifier(activity.item), 'CHRISPREMADES.Macros.Generic.Common.NotEnoughUses');
    const pools = activityUtils.getRecoveryPools(activity).filter(({document}) => document.documentName === 'Item').map(({document}) => document);
    if (config.poolCondition === 'empty' && !(pools.length && pools.every(pool => !pool.system.uses.value))) return;
    if (config.poolCondition === 'notFull' && !pools.some(pool => pool.system.uses.spent)) return;
    if (config.hpCondition === 'bloodied' && !(activity.actor.system.attributes.hp.value >= 1 && actorUtils.isBloodied(activity.actor))) return;
    if (config.confirm) {
        const userId = queryUtils.firstOwner(activity.actor, true);
        const others = (targets ?? []).filter(target => target.actor !== activity.actor);
        let selection;
        if (pools.length) selection = await dialogUtils.confirmRecoverUses(activity.item, pools[0], {userId});
        else if (others.length) selection = await dialogUtils.confirm('COMMON.Confirm', _loc('CAT.Dialog.UseOn', {document: activity.item.name, target: others.map(target => target.name).join(', ')}), {userId});
        else selection = await dialogUtils.confirmUseItem(activity.item, {userId});
        if (!selection) return;
    }
    await workflowUtils.completeActivityUse(activity, targets ?? (token ? [token] : []));
}
function consumedIdentifiers(activity) {
    return activity.consumption.targets.filter(target => target.type === 'itemUses').map(target => {
        if (!target.target) return documentUtils.getIdentifier(activity.item);
        if (target.target.includes(':')) return target.target.split(':')[1];
        const item = activity.actor.items.get(target.target);
        return item && documentUtils.getIdentifier(item);
    });
}
async function itemUsed({document: activity, workflow}) {
    if (!workflow.activity || workflow.item === activity.item) return;
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'useOnEvent', configKeys);
    if (!config.events.includes('itemUsed')) return;
    if (config.identifiers.length && !config.identifiers.includes(documentUtils.getIdentifier(workflow.item))) return;
    if (config.activityIdentifiers.length && !config.activityIdentifiers.includes(workflow.activity.identifier)) return;
    const cachedFor = workflow.item.flags.dnd5e?.cachedFor;
    const source = (cachedFor && fromUuidSync(cachedFor, {relative: workflow.actor, strict: false})) || workflow.activity;
    if (config.activationTypes.length && !config.activationTypes.includes(source.activation.type)) return;
    if (config.ownTurn && workflow.token && !combatUtils.isOwnTurn(workflow.token.document)) return;
    if (config.consumedItems.length && !consumedIdentifiers(source).some(identifier => config.consumedItems.includes(identifier))) return;
    let targets = config.sameTargets ? workflow.targets.documents : activity.target?.affects?.type === 'self' ? undefined : Array.from(game.user.targets, token => token.document).filter(token => token.actor !== activity.actor);
    if (targets?.length > 1 && Number(activity.target?.affects?.count) === 1) {
        const selection = await dialogUtils.selectTargetDialog(activity.item.name, 'CHRISPREMADES.Generic.SelectTarget', targets, {userId: queryUtils.firstOwner(activity.actor, true), skipDeadAndUnconscious: false});
        if (!selection?.result) return;
        targets = [selection.result];
    }
    await use(activity, workflow.token?.document, 'itemUsed', targets);
}
async function short({document, token}) {
    await use(document, token, 'short');
}
async function long({document, token}) {
    await use(document, token, 'long');
}
function grappledTargets(activity, token) {
    if (!automationUtils.getGenericConfigValue(activity, 'chris-premades', 'useOnEvent', 'targetGrappled')) return;
    return token ? tokenUtils.getGrappled(token) : [];
}
async function turnStart({document, token}) {
    const targets = grappledTargets(document, token);
    if (targets && !targets.length) return;
    await use(document, undefined, 'turnStart', targets);
}
async function turnEnd({document, token}) {
    const targets = grappledTargets(document, token);
    if (targets && !targets.length) return;
    await use(document, undefined, 'turnEnd', targets);
}
async function nearbyTurnEnd({document: activity, token}) {
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'useOnEvent', configKeys);
    if (!config.events.includes('nearbyTurnEnd') || !token?.actor) return;
    const owner = actorUtils.getFirstToken(activity.actor);
    if (!owner || owner === token || owner.parent !== token.parent || activity.actor.statuses.has('incapacitated')) return;
    if (config.disposition === 'enemy' && !tokenUtils.isEnemy(owner, token)) return;
    if (config.disposition === 'ally' && tokenUtils.isEnemy(owner, token)) return;
    if (config.canSee && !tokenUtils.canSee(owner, token)) return;
    if (config.requireReaction && actorUtils.hasUsedReaction(activity.actor)) return;
    await use(activity, owner, 'nearbyTurnEnd', [token]);
}
async function damaged({document: activity, workflow}) {
    const actor = activity.actor;
    if (!workflow.damageList?.some(ditem => ditem.actorUuid === actor.uuid && (ditem.hpDamage > 0 || ditem.tempDamage > 0))) return;
    if (!automationUtils.getGenericConfigValue(activity, 'chris-premades', 'useOnEvent', 'events')?.includes('damaged')) return;
    if (actor.statuses.has('incapacitated') || !activityUtils.checkCosts(activity)) return;
    if (activity.activation.type === 'reaction' && actorUtils.hasUsedReaction(actor)) return;
    const token = actorUtils.getFirstToken(actor);
    await use(activity, token, 'damaged', token ? [token] : []);
}
async function initiative({document, token}) {
    await use(document, token, 'initiative');
}
/**
 * Uses the activity after a rest, at the start or end of its owner's turn, on initiative, after its owner uses another
 * item, when a nearby creature ends its turn, or after its owner takes damage. Nothing happens when the activity's costs cannot be paid. Turn events
 * skip an incapacitated owner unless While Incapacitated is set.
 */
export const useOnEvent = {
    rules: 'all',
    version: '2.1.11',
    category: 'uses',
    generic: true,
    documents: ['activity'],
    rest: [
        {
            pass: 'actorShort',
            macro: short,
            priority: 50
        },
        {
            pass: 'actorLong',
            macro: long,
            priority: 50
        }
    ],
    roll: [
        {
            pass: 'actorRollFinished',
            macro: itemUsed,
            priority: 200,
            canOverlap: true
        },
        {
            pass: 'targetRollFinished',
            macro: damaged,
            priority: 200,
            canOverlap: true
        }
    ],
    combat: [
        {
            pass: 'actorTurnStart',
            macro: turnStart,
            priority: 50
        },
        {
            pass: 'actorTurnEnd',
            macro: turnEnd,
            priority: 50
        },
        {
            pass: 'nearbyTurnEnd',
            macro: nearbyTurnEnd,
            priority: 50,
            configDistance: 'range'
        },
        {
            pass: 'actorPreInitiative',
            macro: initiative,
            priority: 50
        }
    ],
    genericConfig: {
        events: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.Events.Label',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnEvent.Events.Hint',
            options: [
                {label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.ShortRest', value: 'short'},
                {label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.LongRest', value: 'long'},
                {label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.TurnStart', value: 'turnStart'},
                {label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.TurnEnd', value: 'turnEnd'},
                {label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.ItemUsed', value: 'itemUsed'},
                {label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.Initiative', value: 'initiative'},
                {label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.NearbyTurnEnd', value: 'nearbyTurnEnd'},
                {label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.Damaged', value: 'damaged'}
            ]
        },
        poolCondition: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.PoolCondition.Label',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnEvent.PoolCondition.Hint',
            options: [
                {label: 'CHRISPREMADES.Config.None', value: ''},
                {label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.Empty', value: 'empty'},
                {label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.NotFull', value: 'notFull'}
            ]
        },
        hpCondition: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.HpCondition.Label',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnEvent.HpCondition.Hint',
            options: [
                {label: 'CHRISPREMADES.Config.None', value: ''},
                {label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.Bloodied', value: 'bloodied'}
            ]
        },
        whileIncapacitated: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.WhileIncapacitated.Label',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnEvent.WhileIncapacitated.Hint'
        },
        identifiers: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Identifiers',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnEvent.Identifiers.Hint'
        },
        activityIdentifiers: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.ActivityIdentifiers.Label',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnEvent.ActivityIdentifiers.Hint'
        },
        activationTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.ActivationTypes.Label',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnEvent.ActivationTypes.Hint',
            get options() { return Object.entries(CONFIG.DND5E.activityActivationTypes).map(([value, {label}]) => ({value, label})); }
        },
        ownTurn: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.OwnTurn.Label',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnEvent.OwnTurn.Hint'
        },
        consumedItems: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.ConsumedItems.Label',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnEvent.ConsumedItems.Hint'
        },
        requiredEffects: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.RequiredEffects.Label',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnEvent.RequiredEffects.Hint'
        },
        range: {
            default: 0,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Range',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnEvent.Range.Hint'
        },
        disposition: {
            default: 'any',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.Disposition',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnEvent.Disposition.Hint',
            options: [
                {label: 'CHRISPREMADES.Macros.Generic.RollBonus.Disposition.Any', value: 'any'},
                {label: 'CHRISPREMADES.Macros.Generic.RollBonus.Disposition.Enemy', value: 'enemy'},
                {label: 'CHRISPREMADES.Macros.Generic.RollBonus.Disposition.Ally', value: 'ally'}
            ]
        },
        canSee: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.CanSee.Label',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnEvent.CanSee.Hint'
        },
        requireReaction: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.RequireReaction.Label',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnEvent.RequireReaction.Hint'
        },
        targetGrappled: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.TargetGrappled.Label',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnEvent.TargetGrappled.Hint'
        },
        sameTargets: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.SameTargets.Label',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnEvent.SameTargets.Hint'
        },
        confirm: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.PromptToUse',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnEvent.Confirm.Hint'
        }
    }
};
const configKeys = Object.keys(useOnEvent.genericConfig);
