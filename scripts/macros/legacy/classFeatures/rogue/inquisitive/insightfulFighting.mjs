import {documentUtils} from '../../../../../proxy.mjs';
async function doSneak({actor, data: {workflow}}) {
    if (workflow.disadvantage && !workflow.advantage) return;
    const targetActor = workflow.targets.documents[0]?.actor;
    if (!targetActor) return;
    if (documentUtils.getEffectByIdentifier(targetActor, 'insightfulFightingTarget', {sourceActor: actor})) return true;
}
async function used({workflow, actor}) {
    if (!workflow.failedSaves?.count) return;
    const marked = new Set(workflow.failedSaves.documents.map(token => token.actor?.uuid));
    const stale = workflow.token.document.parent.tokens.filter(token => token.actor && !marked.has(token.actor.uuid)).flatMap(token => documentUtils.getEffectByIdentifier(token.actor, 'insightfulFightingTarget', {multiple: true, sourceActor: actor}));
    await Promise.all(stale.map(effect => documentUtils.deleteDocument(effect)));
}
export const insightfulFighting = {
    name: 'Insightful Fighting',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: used,
            priority: 50
        }
    ],
    called: [
        {
            pass: 'actorSneakAttackDoSneak',
            macro: doSneak,
            priority: 50
        }
    ]
};
