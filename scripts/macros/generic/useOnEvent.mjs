import {activityUtils, automationUtils, dialogUtils, documentUtils, Logging, queryUtils, workflowUtils} from '../../proxy.mjs';
async function use(activity, token, event) {
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'useOnEvent', configKeys);
    if (!config.events.includes(event)) return;
    if (event === 'long' && config.events.includes('short')) return;
    if (['turnStart', 'turnEnd'].includes(event) && activity.actor.statuses.has('incapacitated')) return;
    if (!activityUtils.checkCosts(activity)) return Logging.addMacroWarning('CPR', documentUtils.getIdentifier(activity.item), 'CHRISPREMADES.Macros.Generic.Common.NotEnoughUses');
    const pools = activityUtils.getRecoveryPools(activity).filter(({document}) => document.documentName === 'Item').map(({document}) => document);
    if (config.poolCondition === 'empty' && !(pools.length && pools.every(pool => !pool.system.uses.value))) return;
    if (config.poolCondition === 'notFull' && !pools.some(pool => pool.system.uses.spent)) return;
    if (config.confirm) {
        const userId = queryUtils.firstOwner(activity.actor, true);
        const selection = pools.length ? await dialogUtils.confirmRecoverUses(activity.item, pools[0], {userId}) : await dialogUtils.confirmUseItem(activity.item, {userId});
        if (!selection) return;
    }
    await workflowUtils.completeActivityUse(activity, token ? [token] : []);
}
async function short({document, token}) {
    await use(document, token, 'short');
}
async function long({document, token}) {
    await use(document, token, 'long');
}
async function turnStart({document}) {
    await use(document, undefined, 'turnStart');
}
async function turnEnd({document}) {
    await use(document, undefined, 'turnEnd');
}
/**
 * Uses the activity after a rest or at the start or end of its owner's turn. Nothing happens when the activity's costs
 * cannot be paid. Turn events skip an incapacitated owner.
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
                {label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.TurnEnd', value: 'turnEnd'}
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
