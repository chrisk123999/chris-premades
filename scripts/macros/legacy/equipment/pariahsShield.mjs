import {activityUtils, actorUtils, automationUtils, dialogUtils, documentUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function updateBonus({document: item}) {
    const token = actorUtils.getFirstToken(item.actor);
    if (!token) return;
    const {range, maxBonus} = automationUtils.getConfigValues(item, ['range', 'maxBonus']);
    const allies = itemUtils.getEquipmentState(item) ? tokenUtils.findNearby(token, Number(range), {disposition: 'ally', includeIncapacitated: true}).length : 0;
    const bonus = Math.min(Math.floor(allies / 2), Number(maxBonus));
    if ((item.system.armor.magicalBonus ?? 0) !== bonus) await documentUtils.update(item, {'system.armor.magicalBonus': bonus});
}
async function protect({document: item, targetToken, ditem}) {
    if (!itemUtils.getEquipmentState(item) || ditem.totalDamage <= 0) return;
    const token = actorUtils.getFirstToken(item.actor);
    if (!token || token === targetToken || token.disposition !== targetToken.disposition) return;
    if (token.inCombat && actorUtils.hasUsedReaction(item.actor)) return;
    if (tokenUtils.getDistance(token, targetToken) > 5 || !tokenUtils.canSee(token, targetToken)) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'pariahs-shield-protect');
    if (!activity) return;
    const userId = queryUtils.firstOwner(item.actor, true);
    if (!await dialogUtils.confirm(item.name, _loc('CHRISPREMADES.Macros.Legacy.PariahsShield.Protect', {name: targetToken.name, item: item.name}), {userId})) return;
    const damage = ditem.hpDamage + ditem.tempDamage;
    workflowUtils.negateDamageItemDamage(ditem);
    await workflowUtils.syntheticActivityDataRoll(activityUtils.getDamageModifiedActivityData(activity, String(damage)), item, [token], {userId});
    if (token.inCombat) await actorUtils.setReactionUsed(item.actor);
}
export const pariahsShield = {
    name: 'Pariah\'s Shield',
    version: '2.1.7',
    rules: '2014',
    roll: [
        {
            pass: 'sceneDamageComplete',
            macro: protect,
            priority: 150
        }
    ],
    move: [
        {
            pass: 'sceneMoved',
            macro: updateBonus,
            priority: 50
        }
    ],
    item: [
        {
            pass: 'equipped',
            macro: updateBonus,
            priority: 50
        },
        {
            pass: 'unequipped',
            macro: updateBonus,
            priority: 50
        }
    ],
    config: {
        range: {
            default: 5,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'homebrew'
        },
        maxBonus: {
            default: 3,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Legacy.PariahsShield.MaxBonus',
            category: 'homebrew'
        }
    }
};
