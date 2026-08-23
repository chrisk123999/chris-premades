import {actorUtils, automationUtils, dialogUtils, queryUtils, workflowUtils} from '../../../../../proxy.mjs';
async function damageApplication({targetToken, ditem}) {
    if (!ditem.isHit) return;
    if (!actorUtils.hasSpellSlots(targetToken.actor)) return;
    if (actorUtils.hasUsedReaction(targetToken.actor)) return;
    const originItem = actorUtils.getItemByIdentifier(targetToken.actor, 'song-of-defense');
    if (!originItem) return;
    const selection = await dialogUtils.selectSpellSlots(targetToken.actor, originItem.name, _loc('CHRISPREMADES.Macros.Legacy.SongOfDefense.Select'), {maxAmount: 1, maxAmountMode: 'count', userId: queryUtils.firstOwner(targetToken.actor, true)});
    if (!selection?.length) return;
    const reductionPerLevel = automationUtils.getConfigValue(originItem, 'reductionPerLevel');
    let damageReduction = targetToken.actor.system.spells[selection[0].key].level * reductionPerLevel;
    await actorUtils.spendSpellSlots(targetToken.actor, selection[0].key);
    const totalDone = ditem.damageDetail.reduce((acc, i) => acc + i.value, 0);
    damageReduction = Math.min(totalDone, damageReduction);
    ditem.damageDetail.push({value: -damageReduction, type: 'none'});
    ditem.hpDamage = totalDone - damageReduction;
    await workflowUtils.completeItemUse(originItem);
}
export const songOfDefense = {
    name: 'Song of Defense',
    version: '2.0.3',
    rules: '2014',
    roll: [
        {
            pass: 'targetDamageFlatReductions',
            macro: damageApplication,
            priority: 50
        }
    ],
    config: {
        reductionPerLevel: {
            default: 5,
            type: 'number',
            label: 'CHRISPREMADES.Macros.Legacy.SongOfDefense.ReductionPerLevel',
            category: 'homebrew'
        }
    }
};
