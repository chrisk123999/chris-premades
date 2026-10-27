import {dialogUtils, documentUtils, itemUtils, Logging, queryUtils, workflowUtils} from '../../../proxy.mjs';
async function preInitiative({document: item, actor, token, combat}) {
    if (actor.type !== 'character' || !actor.system.attributes.inspiration) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'family-first');
    if (!activity) return Logging.addMacroWarning('CPR', 'family-first', 'Missing the family-first activity.', {notify: 'warn'});
    if (!await dialogUtils.confirmUseItem(item, {userId: queryUtils.firstOwner(actor, true)})) return;
    const allies = combat.combatants.filter(combatant => combatant.token && combatant.actor && combatant.actor !== actor && combatant.initiative === null && combatant.token.disposition === token.disposition).map(combatant => combatant.token);
    await documentUtils.update(actor, {'system.attributes.inspiration': false});
    await workflowUtils.completeActivityUse(activity, [token, ...new Set(allies)]);
}
export const familyFirst = {
    name: 'Family First',
    version: '2.1.4',
    rules: '2024',
    combat: [
        {
            pass: 'actorPreInitiative',
            macro: preInitiative,
            priority: 50
        }
    ]
};
