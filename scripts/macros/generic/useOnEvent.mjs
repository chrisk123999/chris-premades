import {activityUtils, automationUtils, dialogUtils, queryUtils, workflowUtils} from '../../proxy.mjs';
async function use(activity, token, event) {
    const config = automationUtils.getGenericConfigValues(activity, 'chris-premades', 'useOnEvent', configKeys);
    if (!config.events.includes(event)) return;
    if (event === 'long' && config.events.includes('short')) return;
    if (!activityUtils.checkCosts(activity)) return;
    const pools = activityUtils.getRecoveryPools(activity).filter(({document}) => document.documentName === 'Item').map(({document}) => document);
    if (config.poolCondition === 'empty' && !(pools.length && pools.every(pool => !pool.system.uses.value))) return;
    if (config.poolCondition === 'notFull' && !pools.some(pool => pool.system.uses.spent)) return;
    if (config.confirm) {
        const userId = queryUtils.firstOwner(activity.actor, true);
        const selection = pools.length ? await dialogUtils.confirmRecoverUses(activity.item, pools[0], {userId}) : await dialogUtils.confirmUseItem(activity.item, {userId});
        if (!selection) return;
    }
    await workflowUtils.completeActivityUse(activity, token ? [token.document ?? token] : []);
}
async function short({document, token}) {
    await use(document, token, 'short');
}
async function long({document, token}) {
    await use(document, token, 'long');
}
export const useOnEvent = {
    rules: 'all',
    version: '2.0.0',
    category: 'utility',
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
    genericConfig: {
        events: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.Events',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnEvent.EventsHint',
            options: [
                {label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.ShortRest', value: 'short'},
                {label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.LongRest', value: 'long'}
            ]
        },
        poolCondition: {
            default: '',
            type: 'select',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.UseOnEvent.PoolCondition',
            hint: 'CHRISPREMADES.Macros.Generic.UseOnEvent.PoolConditionHint',
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
            label: 'CHRISPREMADES.Config.PromptToUse'
        }
    }
};
const configKeys = Object.keys(useOnEvent.genericConfig);
