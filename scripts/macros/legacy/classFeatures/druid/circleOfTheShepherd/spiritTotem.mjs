import {actorUtils, dialogUtils, itemUtils, queryUtils, summonUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
const translations = 'CHRISPREMADES.Macros.Legacy.SpiritTotem.';
function getTotem(item, identifier) {
    return summonUtils.getSummonsBySource(item).find(summon => summon.identifier === identifier && summon.token);
}
function alliesNear(item, totem) {
    const owner = actorUtils.getFirstToken(item.actor);
    return tokenUtils.findNearby(totem.token, 30).filter(token => token.disposition === owner?.disposition);
}
async function hawk({document, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'attack') || !workflow.token) return;
    const totem = getTotem(document, 'spirit-totem-hawk');
    const target = workflow.targets.first()?.document;
    if (!totem || !target || actorUtils.hasUsedReaction(document.actor)) return;
    const owner = actorUtils.getFirstToken(document.actor);
    if (workflow.token.document.disposition !== owner?.disposition) return;
    if (tokenUtils.getDistance(totem.token, target) > 30) return;
    const activity = itemUtils.getActivityByIdentifier(document, 'hawk-spirit');
    if (!activity) return;
    if (!await dialogUtils.confirm(document.name, _loc(translations + 'HawkAttack', {name: workflow.token.name}), {userId: queryUtils.firstOwner(document.actor, true)})) return;
    workflow.tracker.advantage.add('spirit-totem-hawk', activity.name);
    await actorUtils.setReactionUsed(document.actor);
    await workflowUtils.completeActivityUse(activity, [target], {consumeUsage: false, consumeResources: false, spellSlot: false});
}
async function unicorn({document, workflow}) {
    if (workflow.item.type !== 'spell' || !workflow.item.system.level || !workflow.activity.consumption.spellSlot) return;
    if (!workflow.damageList?.some(entry => entry.newHP > entry.oldHP)) return;
    const totem = getTotem(document, 'spirit-totem-unicorn');
    const activity = itemUtils.getActivityByIdentifier(document, 'unicorn-spirit');
    if (!totem || !activity) return;
    const targets = alliesNear(document, totem);
    if (targets.length) await workflowUtils.completeActivityUse(activity, targets, {consumeUsage: false, consumeResources: false, spellSlot: false});
}
function detect({document: effect}) {
    return {type: 'advantage', label: _loc(translations + 'Detect', {name: effect.name})};
}
export const spiritTotem = {
    name: 'Spirit Totem',
    version: '2.1.3',
    rules: '2014',
    roll: [
        {pass: 'sceneAttackRollConfig', macro: hawk, priority: 60},
        {pass: 'actorRollFinished', macro: unicorn, priority: 60}
    ]
};
export const spiritTotemDetect = {
    name: 'Spirit Totem: Unicorn Spirit',
    version: spiritTotem.version,
    rules: spiritTotem.rules,
    check: [
        {pass: 'actorContext', macro: detect, priority: 50}
    ],
    skill: [
        {pass: 'actorContext', macro: detect, priority: 50}
    ]
};
