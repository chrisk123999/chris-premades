import {actorUtils, dialogUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function attack({document: item, workflow}) {
    if (!workflow.attackRoll || workflow.targets.count !== 1 || !workflow.token) return;
    const target = workflow.targets.documents[0];
    const owner = actorUtils.getFirstToken(item.actor);
    if (!owner || !target.actor || workflow.actor === item.actor || workflow.token.document.disposition === owner.disposition) return;
    if (!item.system.uses.value || actorUtils.hasUsedReaction(item.actor) || item.actor.statuses.has('incapacitated')) return;
    if (target !== owner && (!tokenUtils.isWithinDistance(owner, target, 30) || !tokenUtils.canSee(owner, target))) return;
    if (!workflow.isCritical && (workflow.isFumble || workflow.attackRoll.total < target.actor.system.attributes.ac.value)) return;
    const attacker = workflow.token.document;
    const options = tokenUtils.findNearby(owner, 30, {disposition: 'all', includeToken: true}).filter(token => token !== attacker && token !== target && token.actor);
    if (!options.length) return;
    const userId = queryUtils.firstOwner(item.actor, true);
    const selection = await dialogUtils.selectTargetDialog(item.name, _loc('CHRISPREMADES.Macros.Legacy.CloudRune.Reaction', {item: item.name, name: target.name}), options, {userId, skipDeadAndUnconscious: false, buttons: 'yesNo'});
    const newTarget = selection?.result;
    if (!newTarget) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'use') ?? item.system.activities.contents[0];
    await workflowUtils.completeActivityUse(activity, [target], {userId});
    await workflowUtils.updateTargets(workflow, [newTarget], queryUtils.firstOwner(workflow.actor, true));
}
export const cloudRune = {
    name: 'Cloud Rune',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'sceneAttackRollBonuses',
            macro: attack,
            priority: 260
        }
    ]
};
