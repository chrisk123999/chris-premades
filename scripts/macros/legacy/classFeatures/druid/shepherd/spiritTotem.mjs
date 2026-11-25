import {actorUtils, automationUtils, dialogUtils, itemUtils, queryUtils, summonUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
const translations = 'CHRISPREMADES.Macros.Legacy.SpiritTotem.';
function getTotem(item, identifier) {
    return summonUtils.getSummonsBySource(item).find(summon => summon.identifier === identifier && summon.token);
}
function getRange(item) {
    return automationUtils.getConfigValue(item, 'range') ?? spiritTotem.config.range.default;
}
function alliesNear(item, totem) {
    const owner = actorUtils.getFirstToken(item.actor);
    return tokenUtils.findNearby(totem.token, getRange(item)).filter(token => token.disposition === owner?.disposition);
}
async function hawk({document, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'attack') || !workflow.token) return;
    const totem = getTotem(document, 'spirit-totem-hawk');
    const target = workflow.targets.tokens[0]?.document;
    if (!totem || !target || actorUtils.hasUsedReaction(document.actor)) return;
    if (!tokenUtils.isWithinDistance(totem.token, target, getRange(document))) return;
    const activity = itemUtils.getActivityByIdentifier(document, 'hawk-spirit');
    if (!activity) return;
    if (!await dialogUtils.confirm(document.name, _loc(translations + 'HawkAttack', {name: workflow.token.name}), {userId: queryUtils.firstOwner(document.actor, true)})) return;
    workflow.tracker.advantage.add('spirit-totem-hawk', activity.name);
    await actorUtils.setReactionUsed(document.actor);
    await workflowUtils.completeActivityUse(activity, [target], {consumeResources: false, spellSlot: false});
}
async function unicorn({document, workflow}) {
    if (workflow.item.type !== 'spell' || !workflow.item.system.level || !workflow.activity.consumption.spellSlot) return;
    if (!workflow.damageList?.some(entry => entry.newHP > entry.oldHP)) return;
    const totem = getTotem(document, 'spirit-totem-unicorn');
    const activity = itemUtils.getActivityByIdentifier(document, 'unicorn-spirit');
    if (!totem || !activity) return;
    const targets = alliesNear(document, totem);
    if (targets.length) await workflowUtils.completeActivityUse(activity, targets, {consumeResources: false, spellSlot: false});
}
async function incapacitated({document: item, effect}) {
    if (!effect.statuses.has('incapacitated')) return;
    await Promise.all(summonUtils.getSummonsBySource(item).map(summon => summonUtils.deleteSummon(summon)));
}
export const spiritTotem = {
    name: 'Spirit Totem',
    version: '2.1.11',
    rules: '2014',
    effect: [
        {pass: 'actorCreated', macro: incapacitated, priority: 50}
    ],
    roll: [
        {pass: 'sceneAttackRollConfig', macro: hawk, priority: 60},
        {pass: 'actorRollFinished', macro: unicorn, priority: 60}
    ],
    config: {
        range: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'homebrew'
        }
    }
};
