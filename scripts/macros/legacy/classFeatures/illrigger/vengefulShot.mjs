import {activityUtils, actorUtils, automationUtils, dialogUtils, documentUtils, effectUtils, itemUtils, queryUtils, tokenUtils, workflowUtils} from '../../../../proxy.mjs';
async function attacked({document: item, workflow}) {
    if (!workflow.token || !workflowUtils.isAttackType(workflow, 'rangedAttack')) return;
    const owner = actorUtils.getFirstToken(item.actor);
    if (!owner || owner.parent !== workflow.token.document.parent || workflow.actor === item.actor) return;
    if (!tokenUtils.isEnemy(owner, workflow.token.document) || actorUtils.hasUsedReaction(item.actor)) return;
    const protectedTarget = workflow.targets.documents.some(target => target === owner || (!tokenUtils.isEnemy(owner, target) && tokenUtils.isWithinDistance(owner, target, automationUtils.getConfigValues(item, ['range']).range) && tokenUtils.canSee(owner, target)));
    if (!protectedTarget) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'shoot');
    if (!activity || !activityUtils.checkCosts(activity) || !await dialogUtils.confirmUseItem(item, {userId: queryUtils.firstOwner(item.actor, true)})) return;
    const effectData = item.effects.contents[0] && documentUtils.getEffectData(item, item.effects.contents[0].id);
    const [effect] = effectData ? await effectUtils.createEffects(item.actor, [effectData]) ?? [] : [];
    await workflowUtils.completeActivityUse(activity, [workflow.token.document]);
    if (effect && item.actor.effects.has(effect.id)) await documentUtils.deleteDocument(effect);
}
export const interdictBoonVengefulShot = {
    name: 'Interdict Boons: Vengeful Shot',
    version: '2.1.10',
    rules: '2014',
    roll: [
        {
            pass: 'sceneAttackRollComplete',
            macro: attacked,
            priority: 300
        }
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
