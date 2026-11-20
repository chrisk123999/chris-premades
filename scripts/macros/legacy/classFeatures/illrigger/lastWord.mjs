import {activityUtils, actorUtils, dialogUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
async function dropped({document: item, ditem, targetToken}) {
    if (ditem.newHP !== 0 || ditem.oldHP === 0) return;
    const seals = actorUtils.getItemByIdentifier(item.actor, 'baleful-interdict');
    const activity = itemUtils.getActivityByIdentifier(item, 'explode');
    if (!seals?.system.uses.value || !activity || !activityUtils.checkCosts(activity)) return;
    const enemies = tokenUtils.findNearby(targetToken, activityUtils.getRange(activity), {disposition: 'enemy'}).filter(token => token.actor);
    if (!enemies.length) return;
    const max = Math.min(dnd5e.utils.simplifyBonus(activity.consumption.scaling.max, activity.getRollData({deterministic: true})) || 1, seals.system.uses.value);
    const buttons = Array.from({length: max}, (_, index) => index + 1).map(count => [_loc('CHRISPREMADES.Macros.Legacy.LastWord.Use', {count}), count]);
    buttons.push(['CHRISPREMADES.Macros.Legacy.LastWord.No', false]);
    const count = await dialogUtils.buttonDialog(item.name, _loc('CHRISPREMADES.Macros.Legacy.LastWord.Prompt', {itemName: item.name}), buttons, {userId: queryUtils.firstOwner(item.actor, true)});
    if (!count) return;
    const workflow = await workflowUtils.completeActivityUse(activity, enemies, {config: {scaling: count - 1}});
    if (!workflow?.damageList?.some(entry => entry.totalDamage > 0)) return;
    workflowUtils.preventZeroHP(ditem, {targetHP: workflow.damageRolls.reduce((sum, roll) => sum + roll.total, 0)});
}
export const interdictBoonLastWord = {
    name: 'Interdict Boons: Last Word',
    version: '2.1.10',
    rules: '2014',
    roll: [
        {
            pass: 'targetDamageComplete',
            macro: dropped,
            priority: 400
        }
    ]
};
