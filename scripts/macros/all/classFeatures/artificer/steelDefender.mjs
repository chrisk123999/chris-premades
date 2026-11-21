import {actorUtils, dialogUtils, documentUtils, genericUtils, queryUtils, summonUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
async function deflect({document: item, workflow}) {
    if (!workflow.token || !workflowUtils.isAttackType(workflow, 'attack')) return;
    if (workflow.tracker.disadvantage.isActive) return;
    const defender = actorUtils.getFirstToken(item.actor);
    if (!defender || workflow.actor === item.actor || workflow.targets.has(defender)) return;
    if (actorUtils.hasUsedReaction(item.actor) || item.actor.statuses.has('incapacitated')) return;
    if (!tokenUtils.isEnemy(defender, workflow.token.document)) return;
    if (!tokenUtils.isWithinDistance(defender, workflow.token.document, 5) || !tokenUtils.canSee(defender, workflow.token.document)) return;
    const owner = summonUtils.getSummonData(item.actor)?.owner ?? item.actor;
    if (!await dialogUtils.confirmUseItem(item, {userId: queryUtils.firstOwner(owner, true)})) return;
    workflow.tracker.disadvantage.add('steel-defender-deflect-attack', item.name);
    const activity = item.system.activities.contents[0];
    if (activity && actorUtils.getItemByIdentifier(owner, 'improved-defender')) await workflowUtils.completeActivityUse(activity, [workflow.token.document]);
    await actorUtils.setReactionUsed(item.actor);
}
async function repair({workflow}) {
    const target = workflow.targets.first();
    if (!target?.actor || target.actor === workflow.actor) return;
    const source = summonUtils.getSummonData(workflow.actor)?.sourceDocument;
    const valid = actorUtils.typeOrRace(target.actor) === 'construct' || target.actor.type === 'vehicle';
    const seen = documentUtils.getRules(source?.item ?? source) !== '2024' || tokenUtils.canSee(workflow.token?.document, target.document ?? target);
    if (valid && seen) return;
    genericUtils.notify('CHRISPREMADES.Macros.All.SteelDefender.RepairTarget', {type: 'warn'});
    workflow.aborted = true;
    return true;
}
export const steelDefenderDeflectAttack = {
    name: 'Deflect Attack',
    version: '2.1.11',
    rules: 'all',
    roll: [
        {
            pass: 'sceneAttackRollConfig',
            macro: deflect,
            priority: 550
        }
    ]
};
export const steelDefenderRepair = {
    name: 'Repair',
    version: '2.1.11',
    rules: 'all',
    roll: [
        {
            pass: 'itemPreItemRoll',
            macro: repair,
            priority: 50
        }
    ]
};
