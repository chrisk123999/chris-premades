import {actorUtils, dialogUtils, documentUtils, genericUtils, itemUtils, queryUtils, workflowUtils} from '../../../proxy.mjs';
function isValid(combatant, self) {
    const token = combatant.token;
    if (!token?.actor || combatant.initiative === null || combatant.initiative === undefined) return false;
    if (token.disposition !== self.disposition) return false;
    return !token.actor.statuses.has('incapacitated');
}
function warn(key) {
    genericUtils.notify('CHRISPREMADES.Macros.Modern.Alert.' + key, {type: 'warn'});
}
async function swap({document: item, workflow}) {
    const token = workflow.token?.document;
    const combat = token?.combatant?.combat;
    if (!combat || combat.round > 1 || combat.turn > 0) return warn('NotStart');
    const own = token.combatant;
    if (!isValid(own, token)) return warn('Invalid');
    const allies = combat.combatants.filter(combatant => combatant !== own && isValid(combatant, token));
    if (!allies.length) return warn('NoAllies');
    const targeted = allies.find(combatant => workflow.targets.documents.some(target => target === combatant.token));
    const ally = targeted ?? await dialogUtils.selectDocumentDialog(item.name, 'CHRISPREMADES.Macros.Modern.Alert.Select', allies, {userId: queryUtils.firstOwner(item.actor, true)});
    if (!ally) return;
    const initiative = own.initiative;
    await documentUtils.update(own, {initiative: ally.initiative});
    await documentUtils.update(ally, {initiative});
}
async function updateCombatant(combatant, updates, context, userId) {
    if (userId !== game.user.id || !context.cat?.isFirstInitiativeRoll || !('initiative' in updates)) return;
    const combat = combatant.combat;
    const token = combatant.token;
    if (!combat || !token?.actor || combat.round > 1 || combat.turn > 0) return;
    const item = actorUtils.getItemByIdentifier(token.actor, 'alert');
    const activity = item && itemUtils.getActivityByIdentifier(item, 'initiative-swap');
    if (!activity || !isValid(combatant, token)) return;
    if (!combat.combatants.some(other => other !== combatant && isValid(other, token))) return;
    const selection = await dialogUtils.confirmUseItem(item, {userId: queryUtils.firstOwner(token.actor, true)});
    if (!selection) return;
    await workflowUtils.completeActivityUse(activity);
}
export const alertHooks = {
    updateCombatant
};
export const alert = {
    name: 'Alert',
    version: '2.1.9',
    rules: '2024',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: swap,
            priority: 50
        }
    ]
};
