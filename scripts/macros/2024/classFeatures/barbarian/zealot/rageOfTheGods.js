import {activityUtils, actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function protectionHelper(token, targetToken, ditem) {
    if (actorUtils.hasUsedReaction(token.actor)) return;
    let effect = effectUtils.getEffectByIdentifier(token.actor, 'rageOfTheGodsEffect');
    if (!effect) return;
    let item = itemUtils.getItemByIdentifier(token.actor, 'rageOfTheGods');
    if (!item) return;
    let rageItem = itemUtils.getItemByIdentifier(token.actor, 'rage');
    if (!rageItem?.system?.uses?.value) return;
    let classIdentifier = itemUtils.getConfig(item, 'classIdentifier');
    let classItem = token.actor.classes[classIdentifier];
    if (!classItem) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'revivification');
    if (!activity) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.RageOfTheGods', {item: item.name, token: targetToken.document.name}), {userId: socketUtils.firstOwner(token.actor, true)});
    if (!selection) return;
    let barbarianLevel = classItem.system.levels;
    ditem.totalDamage = ditem.oldHP - barbarianLevel;
    ditem.newHP = barbarianLevel;
    ditem.newTempHP = 0;
    ditem.hpDamage = ditem.totalDamage;
    ditem.damageDetail.forEach(i => i.value = 0);
    ditem.damageDetail[0].value = ditem.totalDamage;
    await genericUtils.update(rageItem, {'system.uses.spent': rageItem.system.uses.spent + 1});
    await workflowUtils.syntheticActivityRoll(activity, [targetToken]);
    return true;
}
async function targetDamageApplication({trigger: {token}, ditem}) {
    if (!ditem.isHit || ditem.newHP != 0 || ditem.oldHP === 0) return;
    await protectionHelper(token, token, ditem);
}
async function damageApplication({trigger: {targetToken}, ditem}) {
    if (!ditem.isHit || ditem.newHP != 0 || ditem.oldHP === 0) return;
    let nearbyTokens = tokenUtils.findNearby(targetToken, 30, 'ally', {includeIncapacitated: false, includeToken: true});
    for (let i of nearbyTokens) {
        let saved = await protectionHelper(i, targetToken, ditem);
        if (saved) break;
    }
}
export let rageOfTheGods = {
    name: 'Rage of the Gods',
    version: '1.1.29',
    rules: 'modern',
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'barbarian',
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let rageOfTheGodsEffect = {
    name: rageOfTheGods.name,
    version: rageOfTheGods.version,
    rules: rageOfTheGods.version,
    midi: {
        actor: [
            {
                pass: 'sceneApplyDamage',
                macro: damageApplication,
                priority: 250
            },
            {
                pass: 'targetApplyDamage',
                macro: targetDamageApplication,
                priority: 250
            }
        ]
    }
};