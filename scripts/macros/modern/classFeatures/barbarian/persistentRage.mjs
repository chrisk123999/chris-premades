import {actorUtils, dialogUtils, queryUtils, workflowUtils} from '../../../../proxy.mjs';
async function combatStart({document: activity}) {
    if (!activity.item.system.uses.value) return;
    const rage = actorUtils.getItemByIdentifier(activity.actor, 'rage');
    if (!rage?.system.uses.spent) return;
    if (!await dialogUtils.confirmRecoverUses(activity.item, rage, {userId: queryUtils.firstOwner(activity.actor, true)})) return;
    await workflowUtils.completeActivityUse(activity);
}
export const persistentRage = {
    name: 'Persistent Rage',
    version: '2.1.8',
    rules: '2024',
    combat: [
        {
            pass: 'actorCombatStart',
            macro: combatStart,
            priority: 50
        }
    ]
};
