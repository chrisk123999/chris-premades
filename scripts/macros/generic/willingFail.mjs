import {dialogUtils, queryUtils, tokenUtils} from '../../proxy.mjs';
async function saved({document: activity, workflow}) {
    if (!workflow.token) return;
    for (const target of workflow.saves.documents) {
        if (!target.actor || target.actor === workflow.actor || tokenUtils.isEnemy(workflow.token.document, target)) continue;
        const willing = await dialogUtils.confirm(activity.item.name, _loc('CHRISPREMADES.Macros.Generic.WillingFail.Prompt', {target: target.name, item: activity.item.name}), {userId: queryUtils.firstOwner(target.actor, true)});
        if (!willing) continue;
        workflow.saves.delete(target);
        workflow.failedSaves.add(target);
    }
}
/**
 * Lets each non-hostile target that succeeds on the save choose to fail it instead.
 * Bound on an activity. Fires on `activitySavesComplete`.
 * The target's owner is asked, or the GM when no player owns it.
 */
export const willingFail = {
    rules: 'all',
    version: '2.1.10',
    category: 'mechanics',
    generic: true,
    documents: ['activity'],
    roll: [
        {
            pass: 'activitySavesComplete',
            macro: saved,
            priority: 50
        }
    ]
};
