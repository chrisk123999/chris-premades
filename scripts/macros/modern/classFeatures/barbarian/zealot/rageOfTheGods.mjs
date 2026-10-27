import {actorUtils, dialogUtils, itemUtils, Logging, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function activate({document: activity}) {
    if (!activity.item.system.uses.value) return;
    if (!await dialogUtils.confirmUseItem(activity.item)) return;
    await workflowUtils.syntheticActivityRoll(activity);
}
async function revivification({document: effect, ditem, macroClass: {identifier, source}, targetToken}) {
    if (!ditem.isHit || ditem.newHP !== 0 || ditem.oldHP === 0) return;
    const near = tokenUtils.findNearby(targetToken, 30, {disposition: 'ally', includeToken: true});
    for (const ally of near) {
        if (actorUtils.hasUsedReaction(ally.actor)) continue;
        const item = actorUtils.getItemByIdentifier(ally.actor, 'rage-of-the-gods', {type: 'feat'});
        if (!item) continue;
        const revive = itemUtils.getActivityByIdentifier(item, 'revivification');
        if (!revive) {
            Logging.addMacroWarning(source, identifier, `Rage of the Gods: Revivification exited early without locating the revive activity. (item) ${item.uuid} (identifier) revivification`);
            continue;
        }
        const rage = actorUtils.getItemByIdentifier(effect.actor, 'rage', {type: 'feat'});
        if (!rage?.system.uses.value){
            Logging.addMacroWarning(source, identifier, `Rage of the Gods: Revivification exited early with no remaining rage uses. (rage) ${rage?.uuid}`);
            continue;
        }
        if (!await dialogUtils.queuedConfirmDialog(
            item.name,
            _loc('CHRISPREMADES.Macros.Modern.RageOfTheGods', {item: item.name, token: targetToken.name}),
            {userId: queryUtils.firstOwner(ally.actor, true)}
        )) continue;
        const targetHP = (await workflowUtils.syntheticActivityRoll(revive, [targetToken]))?.utilityRoll.total;
        if (!targetHP) return Logging.addMacroWarning(source, identifier, `Rage of the Gods: Revivification exited early due to a failed heal formula parse. (revive activity) ${revive.uuid} (formula) ${revive.roll.formula}`);
        workflowUtils.preventZeroHP(ditem, {targetHP});
        break;
    }
}
export const rageOfTheGods = {
    name: 'Rage of the Gods',
    version: '2.1.4',
    rules: '2024',
    called: [
        {
            pass: 'actorRageBegin',
            macro: activate,
            priority: 250
        }
    ]
};
export const rageOfTheGodsRevivification = {
    version: rageOfTheGods.version,
    rules: rageOfTheGods.rules,
    roll: [
        {
            pass: 'sceneDamageFlatReductions',
            macro: revivification,
            priority: 500
        }
    ]
};
