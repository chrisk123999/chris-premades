import {actorUtils, dialogUtils, documentUtils, effectUtils, genericUtils, queryUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
async function attacked({workflow}) {
    if (workflow.targets.size !== 1) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    const target = workflow.targets.first()?.document;
    if (workflowUtils.getWorkflowProperty(workflow, 'protection.protected')) return;
    if (actorUtils.getEffectByIdentifier(target.actor, 'protectionProtected')) return;
    const near = tokenUtils.findNearby(target, 5, {disposition: 'ally'}).filter(t => {
        if (workflow.token.document.disposition === t.disposition) return;
        if (!t.actor.system.attributes.ac.equippedShield) return;
        if (actorUtils.hasUsedReaction(t.actor)) return;
        if (workflow.targets.has(t.object)) return;
        if (!tokenUtils.canSee(t, workflow.token.document)) return;
        const protection = actorUtils.getItemByIdentifier(t.actor, 'protection') ?? actorUtils.getItemByIdentifier(t.actor, 'fighting-style-protection');
        if (!protection) return;
        genericUtils.setProperty(t, 'chris-premades.protection', protection);
        return true;
    });
    if (!near.length) return;
    for (const t of near) {
        const protection = genericUtils.getProperty(t, 'chris-premades.protection');
        if (!await dialogUtils.confirm(
            protection.name,
            _loc('CHRISPREMADES.Macros.All.Protection', {name: target.name}),
            {userId: queryUtils.firstOwner(t.actor, true)}
        )) continue;
        workflowUtils.setWorkflowProperty(workflow, 'protection.protected', t.uuid);
        if (documentUtils.getRules(protection) === '2014') {
            workflow.tracker.disadvantage.add('fighting-style-protection', protection.name);
            await workflowUtils.syntheticItemRoll(protection, [target]);
            return;
        }
        const protectedData = protection.effects.find(e => documentUtils.getIdentifier(e) === 'protectionProtected')?.toObject();
        const protectorData = protection.effects.find(e => documentUtils.getIdentifier(e) === 'protectionProtector')?.toObject();
        if (!protectedData || !protectorData) return;
        genericUtils.setProperty(protectorData, 'flags.chris-premades.protection.protected', target.uuid);
        genericUtils.setProperty(protectedData, 'flags.chris-premades.protection.protector', t.uuid);
        const protectorEffect = (await effectUtils.createEffects(t.actor, [protectorData]))?.[0];
        if (!protectorEffect) return;
        const protectedEffect = (await effectUtils.createEffects(target.actor, [protectedData], {parentEntity: protectorEffect}))?.[0];
        if (!protectedEffect) return;
        await documentUtils.makeDependent(protectedEffect, [protectorEffect]);
        await workflowUtils.syntheticItemRoll(protection, [target]);
        workflow.tracker.disadvantage.add('protection', protection.name);
        return;
    }
}
export const protection = {
    name: 'Protection',
    rules: 'all',
    version: '2.0.3',
    roll: [
        {
            pass: 'sceneAttackRollConfig',
            macro: attacked,
            priority: 600
        }
    ]
};
