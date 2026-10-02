import {combatUtils, documentUtils, effectUtils} from '../../../../../proxy.mjs';
async function cast({workflow, document}) {
    if (!workflow.targets.size || workflow.item?.type !== 'spell') return;
    if (!workflow.actor.statuses.has('invisible')) return;
    if (workflow.token.document.inCombat && !combatUtils.isOwnTurn(workflow.token.document)) return;
    const sourceEffect = documentUtils.getEffectByIdentifier(document, 'magicalAmbushEffect');
    if (!sourceEffect) return;
    const effectData = documentUtils.getEffectData(document, sourceEffect.id, {specialDuration: ['endOfWorkflow']});
    await Promise.all(Array.from(workflow.targets, token => effectUtils.createEffects(token.actor, [effectData])));
}
export const magicalAmbush = {
    name: 'Magical Ambush',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {
            pass: 'actorPreambleComplete',
            macro: cast,
            priority: 100
        }
    ]
};
