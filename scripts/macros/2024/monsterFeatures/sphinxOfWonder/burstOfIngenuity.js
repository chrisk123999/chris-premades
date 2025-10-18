import {activityUtils, actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, rollUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../utils.js';
async function skillCheck({trigger: {actor, sourceActor, roll, token, entity: item}}) {
    if (actorUtils.hasUsedReaction(item.actor)) return;
    if (!itemUtils.canUse(item)) return;
    let sourceToken = actorUtils.getFirstToken(sourceActor);
    if (!sourceToken) return;
    if (sourceToken.document.disposition != token.document.disposition) return;
    let summonerOnly = itemUtils.getConfig(item, 'summonerOnly');let effect = effectUtils.getEffectByIdentifier(actor, 'summonedEffect');
    if (!effect) return;
    let originItem = await effectUtils.getOriginItem(effect);
    if (!originItem) return;
    if (summonerOnly && originItem.actor.uuid != sourceActor.uuid) return;
    let distance = tokenUtils.getDistance(token, sourceToken);
    if (distance > 30) return;
    if (summonerOnly) {
        let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseFor', {item: item.name, name: sourceToken.name}), {userId: socketUtils.firstOwner(item.actor).id});
        if (!selection) return;
    } else {
        let selection = await dialogUtils.queuedConfirmDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.UseFor', {item: item.name, name: sourceToken.name}), {actor, reason: 'reaction', userId: socketUtils.firstOwner(originItem.actor).id});
        if (!selection) return;
    }
    let activity = activityUtils.getActivityByIdentifier(item, 'autoUse', {strict: true});
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, [sourceToken], {consumeResources: true, consumeUsage: true});
    return await rollUtils.addToRoll(roll, '2');
}
async function selfCheck({trigger: {actor, token, roll, entity: item}}) {
    if (actorUtils.hasUsedReaction(actor)) return;
    if (!itemUtils.canUse(item)) return;
    let selection = await dialogUtils.confirmUseItem(item);
    if (!selection) return;
    let activity = activityUtils.getActivityByIdentifier(item, 'autoUse', {strict: true});
    if (!activity) return;
    await workflowUtils.syntheticActivityRoll(activity, [token], {consumeResources: true, consumeUsage: true});
    return await rollUtils.addToRoll(roll, '2');
}
export let burstOfIngenuity = {
    name: 'Burst of Ingenuity',
    monster: 'Sphinx of Wonder',
    version: '1.3.107',
    rules: 'modern',
    skill: [
        {
            pass: 'sceneBonus',
            macro: skillCheck,
            priority: 50
        },
        {
            pass: 'bonus',
            macro: selfCheck,
            priority: 50
        }
    ],
    save: [
        {
            pass: 'sceneBonus',
            macro: skillCheck,
            priority: 50
        },
        {
            pass: 'bonus',
            macro: selfCheck,
            priority: 50
        }
    ],
    config: [
        {
            value: 'summonerOnly',
            label: 'CHRISPREMADES.Config.SummonerOnly',
            type: 'checkbox',
            default: false,
            category: 'mechanics'
        }
    ]
};