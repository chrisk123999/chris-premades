import {activityUtils, actorUtils, automationUtils, dialogUtils, documentUtils, itemUtils, queryUtils, workflowUtils} from '../../../../proxy.mjs';
import {addStoredExhaustion, getStoredExhaustion} from './digDeep.mjs';
async function turnStart({document: item, token}) {
    const actor = item.actor;
    const activity = itemUtils.getActivityByIdentifier(item, 'use');
    if (!activity || !item.system.uses.value) return;
    const conditions = automationUtils.getConfigValue(item, 'conditions') ?? shakeItOff.config.conditions.default;
    const options = actorUtils.getStatusSources(actor, conditions.filter(condition => condition !== 'exhaustion')) ?? [];
    if (conditions.includes('exhaustion') && ((actor.system.attributes.exhaustion ?? 0) || getStoredExhaustion(actor))) options.push({id: 'exhaustion', uuid: 'exhaustion', name: CONFIG.DND5E.conditionTypes.exhaustion.name, img: CONFIG.DND5E.conditionTypes.exhaustion.img ?? item.img});
    if (!options.length) return;
    const selection = await dialogUtils.selectDocumentDialog(item.name, 'CHRISPREMADES.Macros.Modern.ShakeItOff.Select', options, {addNoneDocument: true, userId: queryUtils.firstOwner(actor, true)});
    if (!selection) return;
    await workflowUtils.completeActivityUse(activity, token ? [token] : []);
    if (selection.id === 'exhaustion') await addStoredExhaustion(actor, -1);
    else await documentUtils.deleteDocument(selection);
}
async function pugnaciousInitiative({document: item}) {
    const actor = item.actor;
    const activity = itemUtils.getActivityByIdentifier(item, 'pugnacious');
    if (!actor || !activity || !activityUtils.checkCosts(activity)) return;
    const pools = activityUtils.getRecoveryPools(activity).filter(({document}) => document.documentName === 'Item').map(({document}) => document);
    if (!(actor.system.attributes.exhaustion ?? 0) && !getStoredExhaustion(actor) && !pools.some(pool => pool.system.uses.spent)) return;
    if (!await dialogUtils.confirmUseItem(item, {userId: queryUtils.firstOwner(actor, true)})) return;
    await workflowUtils.completeActivityUse(activity, []);
}
async function pugnaciousUse({workflow}) {
    if (workflow.activity.identifier === 'pugnacious') await addStoredExhaustion(workflow.actor, -1);
}
export const pugnacious = {
    name: 'Pugnacious',
    version: '2.1.11',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: pugnaciousUse,
            priority: 50
        }
    ],
    combat: [
        {
            pass: 'actorPreInitiative',
            macro: pugnaciousInitiative,
            priority: 50
        }
    ]
};
export const shakeItOff = {
    name: 'Shake It Off',
    version: '2.1.11',
    rules: '2024',
    combat: [
        {
            pass: 'actorTurnStart',
            macro: turnStart,
            priority: 50
        }
    ],
    config: {
        conditions: {
            default: ['blinded', 'charmed', 'deafened', 'frightened', 'paralyzed', 'poisoned', 'restrained', 'stunned', 'exhaustion'],
            type: 'select-many',
            label: 'CHRISPREMADES.Macros.Modern.ShakeItOff.Conditions',
            category: 'homebrew',
            get options() { return Object.entries(CONFIG.DND5E.conditionTypes).map(([value, {name}]) => ({value, label: name})); }
        }
    }
};
