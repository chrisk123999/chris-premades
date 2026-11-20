import {activityUtils, dialogUtils, queryUtils, tokenUtils, workflowUtils} from '../../proxy.mjs';
function attackActivity(item) {
    if (item.type === 'weapon') return item.system.activities.find(activity => activity.type === 'attack');
    return item.system.activities.find(activity => activity.activation?.type === 'action' && activity.damage?.parts?.length);
}
function options(actor, cantrips) {
    const weapons = actor.items.filter(item => item.type === 'weapon' && (item.system.equipped || item.system.identifier === 'unarmed-strike') && attackActivity(item));
    if (!cantrips) return weapons;
    return weapons.concat(actor.items.filter(item => item.type === 'spell' && item.system.level === 0 && attackActivity(item)));
}
export async function offerAllyAttack(title, ally, {cantrips = false, userId = queryUtils.firstOwner(ally.actor, true)} = {}) {
    const choices = options(ally.actor, cantrips);
    if (!choices.length) return;
    const choice = await dialogUtils.selectDocumentDialog(title, 'CHRISPREMADES.Macros.Generic.AllyAttack.' + (cantrips ? 'Choose' : 'ChooseWeapon'), choices, {userId, addNoneDocument: true});
    if (!choice) return;
    const activity = attackActivity(choice);
    if (activity.target?.template?.type || activity.range?.units === 'self') {
        await workflowUtils.completeActivityUse(activity, []);
        return true;
    }
    const range = choice.type === 'weapon' ? choice.system.range.long || choice.system.range.value || choice.system.range.reach || 5 : activityUtils.getRange(activity) || 5;
    const targets = tokenUtils.findNearby(ally, range, {disposition: 'enemy'});
    if (!targets.length) return;
    const target = (await dialogUtils.selectTargetDialog(title, 'CHRISPREMADES.Generic.SelectTarget', targets, {userId}))?.result;
    if (!target) return;
    await workflowUtils.completeActivityUse(activity, [target]);
    return true;
}
