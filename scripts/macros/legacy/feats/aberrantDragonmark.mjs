import {activityUtils, actorUtils, dialogUtils, documentUtils, itemUtils, Logging, queryUtils, rollUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function surge({document: item, workflow}) {
    if (workflow.item.type !== 'spell' || workflow.item.system.level < 1 || workflow.item.system.sourceItem !== 'feat:' + documentUtils.getIdentifier(item)) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'aberrant-dragonmark-damage');
    const healing = itemUtils.getActivityByIdentifier(item, 'aberrant-dragonmark-healing');
    if (!activity || !healing) return Logging.addMacroWarning('CPR', 'aberrant-dragonmark', 'Missing the aberrant-dragonmark-damage or aberrant-dragonmark-healing activity.', {notify: 'warn'});
    const selections = await dialogUtils.selectHitDie(workflow.actor, item.name, 'CHRISPREMADES.Macros.Legacy.AberrantDragonmark.SelectHitDie', {userId: queryUtils.firstOwner(workflow.actor, true)});
    const {formula} = await actorUtils.spendHitDice(workflow.actor, selections, {roll: false});
    if (!formula) return;
    const {roll} = await rollUtils.rollDice(formula, {document: workflow.actor, message: true, flavor: item.name, speaker: ChatMessage.implementation.getSpeaker({actor: workflow.actor}), manual: true});
    const total = roll.total;
    const odd = total % 2 === 1;
    let target = workflow.token?.document;
    if (odd && target) {
        const nearby = tokenUtils.findNearby(target, 30);
        if (nearby.length) target = nearby[Math.floor(Math.random() * nearby.length)];
    }
    if (!target) return;
    const activityData = activityUtils.getDamageModifiedActivityData(odd ? activity : healing, String(total));
    await workflowUtils.syntheticActivityDataRoll(activityData, item, [target], {consumeUsage: false, consumeResources: false, spellSlot: false});
}
export const aberrantDragonmark = {
    name: 'Aberrant Dragonmark',
    version: '2.1.9',
    rules: '2014',
    roll: [
        {
            pass: 'actorRollFinished',
            macro: surge,
            priority: 50
        }
    ]
};
